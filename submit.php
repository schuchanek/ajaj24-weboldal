<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, bool $ok, string $message): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Csak POST kérés engedélyezett.');
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 12 * 1024 * 1024) {
    respond(413, false, 'A beküldés túl nagy.');
}

// Robotcsapda: a látogatók ezt a mezőt nem látják és nem töltik ki.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(200, true, 'Köszönjük.');
}

$remoteIp = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = sys_get_temp_dir() . '/ajaj24-rate-' . hash('sha256', $remoteIp);
$lastRequest = is_file($rateFile) ? (int)file_get_contents($rateFile) : 0;
if ($lastRequest && time() - $lastRequest < 20) {
    respond(429, false, 'Kérjük, várj néhány másodpercet az újabb beküldéssel.');
}
@file_put_contents($rateFile, (string)time(), LOCK_EX);

$allowedTypes = ['visszahivas', 'partneri_erdeklodes', 'sos'];
$formType = (string)($_POST['formType'] ?? '');
if (!in_array($formType, $allowedTypes, true)) {
    respond(422, false, 'Ismeretlen űrlaptípus.');
}

$labels = [
    'formType' => 'Űrlap típusa', 'nev' => 'Név', 'telefon' => 'Telefonszám',
    'email' => 'E-mail', 'uzenet' => 'Üzenet', 'szervezet' => 'Szervezet',
    'kapcsolattarto' => 'Kapcsolattartó', 'egysegek' => 'Egységek száma',
    'problem' => 'Probléma', 'urgency' => 'Sürgősség', 'leiras' => 'Leírás',
    'irsz' => 'Irányítószám', 'kerulet' => 'Kerület / település', 'utca' => 'Utca',
    'hazszam' => 'Házszám', 'emelet' => 'Emelet / ajtó', 'kapucsengo' => 'Kapucsengő'
];

$required = $formType === 'partneri_erdeklodes'
    ? ['szervezet', 'kapcsolattarto', 'telefon', 'email']
    : ($formType === 'sos'
        ? ['problem', 'urgency', 'irsz', 'kerulet', 'utca', 'hazszam', 'nev', 'telefon']
        : ['nev', 'telefon']);

foreach ($required as $field) {
    if (trim((string)($_POST[$field] ?? '')) === '') {
        respond(422, false, 'Kérjük, tölts ki minden kötelező mezőt.');
    }
}

$email = filter_var((string)($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '';
$subjectLabels = [
    'visszahivas' => 'Visszahívási kérés',
    'partneri_erdeklodes' => 'Partneri érdeklődés',
    'sos' => 'SOS hibabejelentés'
];
$subject = '[ajaj24.hu] ' . $subjectLabels[$formType];

$bodyLines = [
    $subjectLabels[$formType],
    'Beküldés ideje: ' . date('Y-m-d H:i:s'),
    'Beküldő IP: ' . $remoteIp,
    str_repeat('-', 42)
];
foreach ($labels as $key => $label) {
    if (!array_key_exists($key, $_POST)) {
        continue;
    }
    $value = trim((string)$_POST[$key]);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if ($value !== '') {
        $bodyLines[] = $label . ': ' . mb_substr($value, 0, 4000);
    }
}
$body = implode("\r\n", $bodyLines) . "\r\n";

$to = 'ajaj24gyorsszolgalat@gmail.com';
$boundary = 'ajaj24_' . bin2hex(random_bytes(12));
$headers = [
    'From: ajaj24 weboldal <website@ajaj24.hu>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"'
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . str_replace(["\r", "\n"], '', $email);
}

$message = '--' . $boundary . "\r\n";
$message .= "Content-Type: text/plain; charset=UTF-8\r\n";
$message .= "Content-Transfer-Encoding: 8bit\r\n\r\n" . $body . "\r\n";

$fileNames = $_FILES['photos']['name'] ?? [];
$fileTmpNames = $_FILES['photos']['tmp_name'] ?? [];
$fileErrors = $_FILES['photos']['error'] ?? [];
$fileSizes = $_FILES['photos']['size'] ?? [];
if (!is_array($fileNames)) {
    $fileNames = [$fileNames]; $fileTmpNames = [$fileTmpNames];
    $fileErrors = [$fileErrors]; $fileSizes = [$fileSizes];
}
$finfo = new finfo(FILEINFO_MIME_TYPE);
$allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/heic' => 'heic'];
foreach (array_slice($fileNames, 0, 6, true) as $i => $originalName) {
    if (($fileErrors[$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
    if (($fileErrors[$i] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || (int)($fileSizes[$i] ?? 0) > 5 * 1024 * 1024) {
        respond(422, false, 'Egy kép feltöltése sikertelen vagy túl nagy.');
    }
    $tmp = (string)($fileTmpNames[$i] ?? '');
    $mime = $finfo->file($tmp) ?: '';
    if (!isset($allowedMimes[$mime])) {
        respond(422, false, 'Csak JPG, PNG, WEBP vagy HEIC kép tölthető fel.');
    }
    $safeName = 'ajaj24-foto-' . ($i + 1) . '.' . $allowedMimes[$mime];
    $encoded = chunk_split(base64_encode((string)file_get_contents($tmp)));
    $message .= '--' . $boundary . "\r\n";
    $message .= 'Content-Type: ' . $mime . '; name="' . $safeName . "\"\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n";
    $message .= 'Content-Disposition: attachment; filename="' . $safeName . "\"\r\n\r\n";
    $message .= $encoded . "\r\n";
}
$message .= '--' . $boundary . "--\r\n";

// Titkosított, webgyökéren kívüli tartalék napló: akkor is megmarad a kérés,
// ha az e-mail kézbesítésével később probléma lenne.
$backupDir = dirname(__DIR__) . '/private_ajaj24_forms';
if (!is_dir($backupDir)) @mkdir($backupDir, 0700, true);
if (is_dir($backupDir)) {
    $backup = $backupDir . '/' . date('Y-m-d') . '.log';
    @file_put_contents($backup, "\n" . $body, FILE_APPEND | LOCK_EX);
    @chmod($backup, 0600);
}

$sent = @mail($to, $subject, $message, implode("\r\n", $headers));
if (!$sent) {
    respond(503, false, 'Az e-mail küldése most nem sikerült. Kérjük, telefonálj.');
}
respond(200, true, 'A beküldés megérkezett.');

