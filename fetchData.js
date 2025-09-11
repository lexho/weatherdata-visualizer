async function fetchData() {
    const url = "http://localhost:8080/api";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        redraw(data)
    } catch (error) {
        console.error(error.message);
    }
}

function redraw(data) {
    // date	time	temp	pressure	tendency	windspeed	winddir
    let date = []; let time = []; let temp = []; let pressure = []; let tendency = []; let windspeed = []; let winddir = [];

    date.push(document.getElementById("date1"))
    time.push(document.getElementById("time1"))
    temp.push(document.getElementById("temp1"))
    pressure.push(document.getElementById("pressure1"))
    tendency.push(document.getElementById("tendency1"))
    windspeed.push(document.getElementById("windspeed1"))
    winddir.push(document.getElementById("winddir1"))

    date.push(document.getElementById("date2"))
    time.push(document.getElementById("time2"))
    temp.push(document.getElementById("temp2"))
    pressure.push(document.getElementById("pressure2"))
    tendency.push(document.getElementById("tendency2"))
    windspeed.push(document.getElementById("windspeed2"))
    winddir.push(document.getElementById("winddir2"))

    date.push(document.getElementById("date3"))
    time.push(document.getElementById("time3"))
    temp.push(document.getElementById("temp3"))
    pressure.push(document.getElementById("pressure3"))
    tendency.push(document.getElementById("tendency3"))
    windspeed.push(document.getElementById("windspeed3"))
    winddir.push(document.getElementById("winddir3"))

    date.push(document.getElementById("date4"))
    time.push(document.getElementById("time4"))
    temp.push(document.getElementById("temp4"))
    pressure.push(document.getElementById("pressure4"))
    tendency.push(document.getElementById("tendency4"))
    windspeed.push(document.getElementById("windspeed4"))
    winddir.push(document.getElementById("winddir4"))

    date.push(document.getElementById("date5"))
    time.push(document.getElementById("time5"))
    temp.push(document.getElementById("temp5"))
    pressure.push(document.getElementById("pressure5"))
    tendency.push(document.getElementById("tendency5"))
    windspeed.push(document.getElementById("windspeed5"))
    winddir.push(document.getElementById("winddir5"))

    for(let i = 0; i < 5; i++) {
        const dataset = data[i]
    date[i].textContent = dataset.date
    time[i].textContent = dataset.time
    temp[i].textContent = dataset.weather.temp.value
    pressure[i].textContent = dataset.weather.pressure.value
    tendency[i].textContent = dataset.weather.tendency.value
    windspeed[i].textContent = dataset.weather.windspeed.value
    winddir[i].textContent = dataset.weather.winddir.value
    }
}

setInterval(() => { fetchData() }, 1000)
