<?php
// SuperCoin PHP Application Entry Point
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/routes.php';

// Set content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Start session
session_start();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove leading slash
$path = ltrim($path, '/');

// Handle API routes
if (strpos($path, 'api/') === 0) {
    $apiPath = substr($path, 4); // Remove 'api/' prefix
    handleApiRoute($method, $apiPath);
} else {
    // Serve frontend for non-API routes
    serveFrontend($path);
}

function handleApiRoute($method, $path) {
    global $routes;
    
    $routeKey = $method . ' ' . $path;
    
    // Check for exact match first
    if (isset($routes[$routeKey])) {
        $handler = $routes[$routeKey];
        call_user_func($handler);
        return;
    }
    
    // Check for parameterized routes
    foreach ($routes as $route => $handler) {
        if (strpos($route, $method . ' ') === 0) {
            $routePath = substr($route, strlen($method) + 1);
            if (preg_match('#^' . str_replace('{id}', '(\d+)', $routePath) . '$#', $path, $matches)) {
                if (isset($matches[1])) {
                    $_GET['id'] = $matches[1];
                }
                call_user_func($handler);
                return;
            }
        }
    }
    
    // Route not found
    http_response_code(404);
    echo json_encode(['message' => 'Route not found']);
}

function serveFrontend($path) {
    // Serve the React frontend (built files)
    if (empty($path) || $path === 'index.html') {
        // Serve main HTML file
        $htmlContent = file_get_contents(__DIR__ . '/public/index.html');
        if ($htmlContent === false) {
            // Fallback HTML if build doesn't exist
            $htmlContent = getDefaultHtml();
        }
        header('Content-Type: text/html');
        echo $htmlContent;
    } else {
        // Serve static assets
        $filePath = __DIR__ . '/public/' . $path;
        if (file_exists($filePath)) {
            $mimeType = getMimeType($filePath);
            header('Content-Type: ' . $mimeType);
            readfile($filePath);
        } else {
            // Fallback to index.html for SPA routing
            serveFrontend('');
        }
    }
}

function getMimeType($filePath) {
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml'
    ];
    
    return $mimeTypes[$extension] ?? 'application/octet-stream';
}

function getDefaultHtml() {
    return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SuperCoin - Investment Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; margin-bottom: 10px; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>SuperCoin Login</h1>
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
        </form>
        <div id="message"></div>
    </div>
    
    <script>
        document.getElementById("loginForm").addEventListener("submit", async function(e) {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById("message").innerHTML = "<p style=\"color: green;\">Login successful! Welcome " + data.user.name + "</p>";
                    // Store session and redirect logic here
                } else {
                    document.getElementById("message").innerHTML = "<p style=\"color: red;\">" + data.message + "</p>";
                }
            } catch (error) {
                document.getElementById("message").innerHTML = "<p style=\"color: red;\">Connection error</p>";
            }
        });
    </script>
</body>
</html>';
}
?>