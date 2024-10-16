// Variables for toggling the camera, location, and WiFi tracking
let isCameraOn = false;
let isLocationOn = false;
let isWiFiOn = false;
let locationWatchId = null;
let scannedBarcodes = new Set(); // Store unique barcodes

// Start the barcode scanner using QuaggaJS
function startBarcodeScanner() {
    if (isCameraOn) return; // Prevent multiple camera instances

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-container'), // Camera feed container
            constraints: {
                facingMode: "environment" // Use rear camera
            }
        },
        decoder: {
            readers: ["code_128_reader"] // Barcode type (CODE128)
        }
    }, function(err) {
        if (err) {
            console.error("Error initializing QuaggaJS:", err);
            alert("Failed to start camera. Please check camera permissions.");
            return;
        }
        Quagga.start();
        isCameraOn = true;
        document.getElementById('scanner-container').style.display = 'block';
        toggleCameraButtons(true);
    });

    // Handle detected barcodes
    Quagga.onDetected(function(result) {
        const barcode = result.codeResult.code;

        if (!scannedBarcodes.has(barcode)) { // Only process new barcodes
            scannedBarcodes.add(barcode);
            document.getElementById('barcode-result').textContent = `Scanned Ticket IDs: ${Array.from(scannedBarcodes).join(', ')}`;

            // Send barcode data to Firestore for validation and deletion
            validateAndDeleteBarcode(barcode);

            // Stop the scanner after 20 barcodes
            if (scannedBarcodes.size === 20) {
                stopBarcodeScanner();
            }
        }
    });
}

// Stop the barcode scanner
function stopBarcodeScanner() {
    if (isCameraOn) {
        Quagga.stop();
        document.getElementById('scanner-container').style.display = 'none';
        isCameraOn = false;
        scannedBarcodes.clear(); // Reset after stopping the camera
        toggleCameraButtons(false);
    }
}

// Toggle camera button visibility
function toggleCameraButtons(isCameraOn) {
    document.getElementById('camera-btn').style.display = isCameraOn ? 'none' : 'inline-block';
    document.getElementById('stop-camera-btn').style.display = isCameraOn ? 'inline-block' : 'none';
}


            // Send location to server (mock example)
            fetch('/update-location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ lat: latitude, lng: longitude })
            });

// Enable WiFi tracking
function enableWiFiTracking() {
    if (!navigator.onLine) {
        alert('WiFi not available. Please connect to a WiFi network.');
        return;
    }

    // Mock example for WiFi tracking
    const wifiSSID = 'Mock WiFi SSID'; // Replace with actual WiFi tracking logic
    document.getElementById('wifi-status').textContent = `Connected to WiFi: ${wifiSSID}`;
    isWiFiOn = true;

    // Send WiFi info to server
    fetch('/update-wifi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ssid: wifiSSID })
    });

    toggleWiFiButtons(true);
}

// Disable WiFi tracking
function disableWiFiTracking() {
    document.getElementById('wifi-status').textContent = 'WiFi tracking disabled';
    isWiFiOn = false;
    toggleWiFiButtons(false);
}

// Toggle WiFi button visibility
function toggleWiFiButtons(isWiFiOn) {
    document.getElementById('wifi-on-btn').style.display = isWiFiOn ? 'none' : 'inline-block';
    document.getElementById('wifi-off-btn').style.display = isWiFiOn ? 'inline-block' : 'none';
}

// Function to validate and delete barcode from Firestore
function validateAndDeleteBarcode(barcode) {
    // Firestore initialization
    const db = firebase.firestore();
    const barcodeRef = db.collection('tickets').doc(barcode);

    barcodeRef.get().then((doc) => {
        if (doc.exists) {
            // Barcode is valid, proceed to delete
            barcodeRef.delete().then(() => {
                alert('Ticket is valid and has been deleted from the server.');
            }).catch((error) => {
                console.error("Error deleting document: ", error);
                alert('Error deleting ticket from server.');
            });
        } else {
            alert('Ticket is invalid.');
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}

// Button Event Listeners
document.getElementById('camera-btn').addEventListener('click', startBarcodeScanner);
document.getElementById('stop-camera-btn').addEventListener('click', stopBarcodeScanner);

document.getElementById('location-on-btn').addEventListener('click', enableLocation);
document.getElementById('location-off-btn').addEventListener('click', disableLocation);

document.getElementById('wifi-on-btn').addEventListener('click', enableWiFiTracking);
document.getElementById('wifi-off-btn').addEventListener('click', disableWiFiTracking);

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}


let videoStream = null;  // To hold the video stream for stopping later
let scannedBarcodes = [];  // Array to store multiple scanned barcodes
let maxBarcodes = 20;      // Set how many barcodes you want to scan before stopping
let currentLocation = null;  // To store the driver's current location

// Function to start the camera
function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function (stream) {
            videoStream = stream;
            const video = document.querySelector('video');
            video.srcObject = stream;
            video.play();

            // Start scanning barcodes
            scanBarcode();
        })
        .catch(function (err) {
            console.log('Error starting camera: ' + err);
        });
}

// Function to scan barcode (using a barcode scanner library like Quagga or any custom implementation)
function scanBarcode() {
    const video = document.querySelector('video');
    
    // Assuming you're using a library like Quagga.js or any other barcode scanning library
    Quagga.onDetected(function (result) {
        const barcode = result.codeResult.code;

        if (!scannedBarcodes.includes(barcode)) {
            scannedBarcodes.push(barcode);
            console.log('Barcode Scanned: ' + barcode);
            
            // Display the scanned barcodes on the page
            displayScannedBarcodes();
        }

        // Stop scanning if maxBarcodes is reached
        if (scannedBarcodes.length >= maxBarcodes) {
            stopCamera();
        }
    });
}

// Function to display the scanned barcodes
function displayScannedBarcodes() {
    const barcodeList = document.getElementById('barcode-list');
    barcodeList.innerHTML = '';  // Clear list before updating
    scannedBarcodes.forEach(function (barcode) {
        const listItem = document.createElement('li');
        listItem.textContent = barcode + ' - VALID';
        barcodeList.appendChild(listItem);
    });
}

// Add event listener for the "Stop Camera" button
document.getElementById('stopCameraButton').addEventListener('click', stopCamera);

