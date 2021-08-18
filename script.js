'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Classes
class Workout {
  date = new Date();
  id = Math.floor(Math.random() * 10 ** 12);
  // #id = (Date.now() + '').slice(-12);

  constructor(coords, distance, duration) {
    this.distance = distance; //in km's
    this.duration = duration; //in mins
    this.coords = coords; //[lat, long]
  }

  _setDesctiption() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDesctiption();
  }
  calcPace() {
    //min/km
    this.pace = (Number(this.duration) / Number(this.distance)).toFixed(1);
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDesctiption();
  }
  calcSpeed() {
    //km/h
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
  }
}
// const run1 = new Running([51.919438, 19.145136], 8, 50, 120);
// console.log(run1);
// const cycling1 = new Cycling([52.919438, 19.145136], 45, 95, 650);
// console.log(cycling1);

///////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHIRECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function (any) {
          const { message } = any;
          alert(`Can not find location. ${message}`);
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);
    // console.log(this);
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    console.log(this.#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Clear input fields
    // prettier-ignore
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1);
  }

  _toggleElevationField(e) {
    e.preventDefault();
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be a positive number');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be a positive number');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new workout to workout array
    this.#workouts.push(workout);

    //Render workout marker
    //Render woorkout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout on list as a list element
    this._renderWorkout(workout);

    this._hideForm();
  }

  //Nie działa
  // _activityCond = (run, cycle) => {
  //   return workout?.type === 'running' ? run : cycle;
  // };

  //Render marker method
  _renderWorkoutMarker(workout) {
    console.log(workout.type);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} \s\ ${workout.description}`
        //Nie działa
        // `${console.log(this)}${this._activityCond('🏃‍♂️', '🚴‍♀️')}${
        //   workout.description
        // }`
      )
      .openPopup();
  }
  //Render workouts method
  _renderWorkout(workout) {
    const activityCond = function (run, cycle) {
      return workout.type === 'running' ? run : cycle;
    };
    let html =
      // prettier-ignore
      `<li class="workout workout--${workout.type}" data-id='${workout.id}'>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              activityCond('🏃‍♂️', '🚴‍♀️')
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit"> km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">
            ⚡️</span>
            <span class="workout__value">${
              activityCond(workout.pace, workout.speed)
            }</span>
            <span class="workout__unit">${
              activityCond('min/km', 'km/h')
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${
              activityCond(workout.cadence, workout.elevation)
            }</span>
            <span class="workout__unit">${
              activityCond('spm', 'm')
            }</span>
          </div>
          </li>`;

    // if (workout.type === 'running') {
    //   html +=
    //     // prettier-ignore
    //     `<div class="workout__details">
    //           <span class="workout__icon">⚡️</span>
    //           <span class="workout__value">${workout.pace}</span>
    //           <span class="workout__unit">min/km<</span>
    //         </div>
    //         <div class="workout__details">
    //           <span class="workout__icon">⛰</span>
    //           <span class="workout__value">${workout.cadence}</span>
    //           <span class="workout__unit">spm</span>
    //         </div>
    //     </li> `;
    // }
    // if (workout.type === 'cycling') {
    //   html +=
    //     // prettier-ignore
    //     `<div class="workout__details">
    //       <span class="workout__icon">⚡️</span>
    //       <span class="workout__value">${workout.speed}</span>
    //       <span class="workout__unit">km/h</span>
    //     </div>
    //     <div class="workout__details">
    //       <span class="workout__icon">⛰</span>
    //       <span class="workout__value">${workout.elevation}</span>
    //       <span class="workout__unit">m</span>
    //     </div>
    //   </li>`;
    // }
    form.insertAdjacentHTML('afterend', `${html}`);
  }
}

const app = new App();
