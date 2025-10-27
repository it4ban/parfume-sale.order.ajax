<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

use Bitrix\Main\Loader;
use Bitrix\Highloadblock\HighloadBlockTable;

Loader::includeModule('highloadblock');

/**
 * Получает список активных компаний доставки из MeaSoft API.
 * Завершает выполнение (die) при ошибке.
 *
 * @return array
 */
function getDeliveryCompanies(): array
{
    $login = 'parfum-paradise';
    $password = 'Berlin100@';
    $extracode = '213';
    $hlblockId = 12;
    $arResult = [];

    $hlblock = HighloadBlockTable::getById($hlblockId)->fetch();
    if (!$hlblock) {
        die('❌ Не найден HL-блок с ID ' . $hlblockId);
    }

    $entity = HighloadBlockTable::compileEntity($hlblock);
    $entityClass = $entity->getDataClass();

    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<storelist>';
    $xml .= '<auth extra="' . htmlspecialchars($extracode) . '"></auth>';
    $xml .= '<json>YES</json>';
    $xml .= '</storelist>';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://home.courierexe.ru/api/',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $xml,
        CURLOPT_USERPWD => "$login:$password",
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if (!$response) {
        die('❌ Ошибка запроса к MeaSoft API: ' . $error);
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        die('❌ Ошибка декодирования JSON: ' . htmlspecialchars($response));
    }

    $active = array_filter($data, static fn($item) => empty($item['disabled']));
    if (empty($active)) {
        die('❌ Не найдено активных служб доставки.');
    }

    $companies = array_values($active);

    $companyNames = array_column($companies, 'name');

    $hlResult = $entityClass::getList([
        'select' => ['UF_COMPANY_NAME', 'UF_COMPANY_IMAGE', 'UF_COMPANY_DESCRIPTION'],
        'filter' => ['UF_COMPANY_NAME' => $companyNames],
    ]);

    $existing = [];
    while ($row = $hlResult->fetch()) {
        $existing[] = $row['UF_COMPANY_NAME'];
        $arResult[] = [
            'NAME' => $row['UF_COMPANY_NAME'],
            'IMG' => CFile::GetPath($row['UF_COMPANY_IMAGE']),
            'DESCRIPTION' => $row['UF_COMPANY_DESCRIPTION'],
        ];
    }

    if (count($arResult) < count($companies)) {
        foreach ($companies as $company) {
            if (!in_array($company['name'], $existing, true)) {
                $addResult = $entityClass::add([
                    'UF_COMPANY_NAME' => $company['name'],
                    'UF_COMPANY_CODE' => $company['code'],
                    'UF_ACTIVE' => 1,
                    'UF_DATE_ADDED' => new DateTime(),
                ]);

                if (!$addResult->isSuccess()) {
                    error_log('Ошибка добавления компании ' . $company['name'] . ': ' . implode(', ', $addResult->getErrorMessages()));
                }
            }
        }
    }

    return $arResult;
}
