<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = htmlspecialchars($_POST['name'] ?? '');
    $event = htmlspecialchars($_POST['event'] ?? '');
    echo "Registration received for $name - $event";
} else {
    echo "Eventora Lite PHP endpoint is working.";
}
?>