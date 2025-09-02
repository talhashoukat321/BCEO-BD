<?php
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Fetch real-time crypto prices from CoinGecko API
function fetchCryptoPrices() {
    $url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,litecoin,chiliz,bitcoin-cash,tron,ethereum-classic&vs_currencies=usd&include_24hr_change=true';
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 5
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        return null;
    }
    
    return json_decode($response, true);
}

$pricesData = fetchCryptoPrices();

if ($pricesData === null) {
    // Fallback to static prices if API fails
    $pricesData = [
        'bitcoin' => ['usd' => 107314.24, 'usd_24h_change' => -0.41],
        'ethereum' => ['usd' => 2449.91, 'usd_24h_change' => -1.44],
        'dogecoin' => ['usd' => 0.16147, 'usd_24h_change' => -1.87],
        'litecoin' => ['usd' => 85.13, 'usd_24h_change' => -0.28],
        'chiliz' => ['usd' => 0.03457, 'usd_24h_change' => -2.59],
        'bitcoin-cash' => ['usd' => 502.8, 'usd_24h_change' => 0.50],
        'tron' => ['usd' => 0.2712, 'usd_24h_change' => 0.15],
        'ethereum-classic' => ['usd' => 45.23, 'usd_24h_change' => 1.23]
    ];
}

// Format prices for frontend
$formattedPrices = [];

$mapping = [
    'bitcoin' => 'BTC/USDT',
    'ethereum' => 'ETH/USDT',
    'dogecoin' => 'DOGE/USDT',
    'litecoin' => 'LTC/USDT',
    'chiliz' => 'CHZ/USDT',
    'bitcoin-cash' => 'BCH/USDT',
    'tron' => 'TRX/USDT',
    'ethereum-classic' => 'ETC/USDT'
];

foreach ($mapping as $coinId => $symbol) {
    if (isset($pricesData[$coinId])) {
        $price = $pricesData[$coinId]['usd'];
        $change = $pricesData[$coinId]['usd_24h_change'];
        
        $formattedPrices[$symbol] = [
            'price' => number_format($price, $price < 1 ? 5 : 2, '.', ''),
            'change' => ($change >= 0 ? '+' : '') . number_format($change, 2) . '%',
            'changeType' => $change >= 0 ? 'positive' : 'negative'
        ];
    }
}

echo json_encode($formattedPrices);
?>