<?php
require_once __DIR__ . '/BaseController.php';

class CryptoController extends BaseController {
    
    public function getCryptoPrices() {
        try {
            // Fetch real-time data from CoinGecko API
            $cryptoIds = [
                'bitcoin' => 'BTC',
                'ethereum' => 'ETH',
                'dogecoin' => 'DOGE',
                'litecoin' => 'LTC',
                'chiliz' => 'CHZ',
                'bitcoin-cash' => 'BCH',
                'solana' => 'SOL',
                'chainlink' => 'LINK',
                'polygon' => 'MATIC',
                'uniswap' => 'UNI'
            ];
            
            $idString = implode(',', array_keys($cryptoIds));
            $url = "https://api.coingecko.com/api/v3/simple/price?ids={$idString}&vs_currencies=usd&include_24hr_change=true";
            
            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'user_agent' => 'SuperCoin PHP App'
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            
            if ($response === false) {
                // Fallback to static prices if API fails
                $fallbackPrices = [
                    'BTC' => ['price' => 107314.24, 'change' => 2.5],
                    'ETH' => ['price' => 2449.91, 'change' => 1.8],
                    'DOGE' => ['price' => 0.08, 'change' => -0.5],
                    'LTC' => ['price' => 73.42, 'change' => 0.3],
                    'CHZ' => ['price' => 0.07, 'change' => -1.2],
                    'BCH' => ['price' => 354.67, 'change' => 1.1],
                    'SOL' => ['price' => 89.32, 'change' => 3.4],
                    'LINK' => ['price' => 11.23, 'change' => 2.1],
                    'MATIC' => ['price' => 0.42, 'change' => -0.8],
                    'UNI' => ['price' => 6.78, 'change' => 1.5]
                ];
                
                $this->success($fallbackPrices);
                return;
            }
            
            $data = json_decode($response, true);
            
            if (!$data) {
                throw new Exception('Invalid response from CoinGecko API');
            }
            
            // Format data for frontend
            $formattedPrices = [];
            foreach ($data as $coinId => $priceData) {
                $symbol = $cryptoIds[$coinId];
                $formattedPrices[$symbol] = [
                    'price' => $priceData['usd'],
                    'change' => $priceData['usd_24h_change'] ?? 0
                ];
            }
            
            $this->success($formattedPrices);
            
        } catch (Exception $e) {
            error_log("Get crypto prices error: " . $e->getMessage());
            
            // Return fallback prices on error
            $fallbackPrices = [
                'BTC' => ['price' => 107314.24, 'change' => 2.5],
                'ETH' => ['price' => 2449.91, 'change' => 1.8],
                'DOGE' => ['price' => 0.08, 'change' => -0.5],
                'LTC' => ['price' => 73.42, 'change' => 0.3],
                'CHZ' => ['price' => 0.07, 'change' => -1.2],
                'BCH' => ['price' => 354.67, 'change' => 1.1],
                'SOL' => ['price' => 89.32, 'change' => 3.4],
                'LINK' => ['price' => 11.23, 'change' => 2.1],
                'MATIC' => ['price' => 0.42, 'change' => -0.8],
                'UNI' => ['price' => 6.78, 'change' => 1.5]
            ];
            
            $this->success($fallbackPrices);
        }
    }
}
?>