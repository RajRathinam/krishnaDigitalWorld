
import axios from 'axios';

async function testLogin() {
    try {
        console.log("Sending login request...");
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            phone: '9789251221'
        });
        console.log("Response:", response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testLogin();
