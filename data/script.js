// Chart.js Global Settings
Chart.defaults.font.family = 'Poppins';
Chart.defaults.font.size = 14;

// Initialize variables for averages
let tempSum = 0, humSum = 0, pitchSum = 0, rollSum = 0;
let tempCount = 0, humCount = 0, pitchCount = 0, rollCount = 0;

// Set up the temperature chart
const tempCtx = document.getElementById('temperatureChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature (°C)',
            data: [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Temperature (°C)' } }
        }
    }
});

// Set up the humidity chart
const humidityCtx = document.getElementById('humidityChart').getContext('2d');
const humidityChart = new Chart(humidityCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Humidity (%)',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Humidity (%)' } }
        }
    }
});

// Set up the tilt chart
const tiltCtx = document.getElementById('tiltChart').getContext('2d');
const tiltChart = new Chart(tiltCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Pitch (°)',
                data: [],
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'Roll (°)',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Tilt Angle (°)' } }
        }
    }
});

// Function to fetch data from the ESP32 server
// Function to fetch data from the ESP32 server
async function fetchSensorData() {
  try {
      const response = await fetch('http://192.168.1.7/data'); // Replace with your ESP32 IP
      const data = await response.json();

      const now = new Date().toLocaleTimeString();

      // Update Temperature Chart
      tempChart.data.labels.push(now);
      tempChart.data.datasets[0].data.push(data.temperature);
      if (tempChart.data.labels.length > 10) {
          tempChart.data.labels.shift();
          tempChart.data.datasets[0].data.shift();
      }
      tempChart.update();

      // Update Humidity Chart
      humidityChart.data.labels.push(now);
      humidityChart.data.datasets[0].data.push(data.humidity);
      if (humidityChart.data.labels.length > 10) {
          humidityChart.data.labels.shift();
          humidityChart.data.datasets[0].data.shift();
      }
      humidityChart.update();

      // Update Tilt Chart
      tiltChart.data.labels.push(now);
      tiltChart.data.datasets[0].data.push(data.pitch);
      tiltChart.data.datasets[1].data.push(data.roll);
      if (tiltChart.data.labels.length > 10) {
          tiltChart.data.labels.shift();
          tiltChart.data.datasets[0].data.shift();
          tiltChart.data.datasets[1].data.shift();
      }
      tiltChart.update();

      // Update Vibration Status
      const vibrationStatusElement = document.getElementById('avg-vibration');
      if (vibrationStatusElement) {
          vibrationStatusElement.textContent = data.vibration ? 'Detected' : 'No Vibration';
      }

      // Update Stats Averages
      tempSum += data.temperature;
      humSum += data.humidity;
      pitchSum += data.pitch;
      rollSum += data.roll;

      tempCount++;
      humCount++;
      pitchCount++;
      rollCount++;

      const avgTemp = (tempSum / tempCount).toFixed(1);
      const avgHum = (humSum / humCount).toFixed(1);
      const avgPitch = (pitchSum / pitchCount).toFixed(1);
      const avgRoll = (rollSum / rollCount).toFixed(1);

      document.getElementById('avg-temp').textContent = `${avgTemp} °C`;
      document.getElementById('avg-humidity').textContent = `${avgHum} %`;
      document.getElementById('avg-tilt').textContent = `Pitch: ${avgPitch}°, Roll: ${avgRoll}°`;

      // Check for Threshold Warnings
      const thresholdWarning = document.getElementById('warning');
      if (thresholdWarning) {
          if (data.thresholdExceeded) {
              thresholdWarning.style.display = 'block';
              thresholdWarning.textContent = 'Warning: Threshold Exceeded!';
          } else {
              thresholdWarning.style.display = 'none';
          }
      }
  } catch (error) {
      console.error("Error fetching data from ESP:", error);
  }
}


// Set an interval to fetch data every 2 seconds
setInterval(fetchSensorData, 2000);
