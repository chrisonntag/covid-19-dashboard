import Vue from 'vue';
import Vuex from 'vuex';
import * as d3 from 'd3';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    data: [],
    dates: [],
    selectedDate: 1612396800000,
    features: [],
    selectedCountries: [],
    countries: [],
    countriesDict: {},
    countryColors: {},
    educationRates: [],
    personalIncome: [],
    highlighted: false,
  },
  mutations: {
    changeCountryColors(state, payload) {
      let payloadPair = payload.split("#");
      state.countryColors[payloadPair[0]] = "#" + payloadPair[1];
    },
    cleanCountryColors(state) {
      state.countryColors = {};
    },
    changeSelectedDate (state, date) {
      state.selectedDate = date;
    },
    changeSelectedCountry(state, val) {
      state.selectedCountries.push(val);
      state.highlighted = true;
    },
    cleanSelectedCountries(state) {
      state.selectedCountries = [];
    },
    changeHighlighted(state, boolean) {
      state.highlighted = boolean === '1';
    },
  },
  getters: {
    data(state) {
      return state.data;
    },
    features(state) {
      return state.features;
    },
    countries(state) {
      return state.countries;
    },
    countryNameDict(state) {
      return state.countriesDict;
    },
    dates(state) {
      return state.dates;
    },
    highlighted: (state) => state.highlighted,
    selectedDate: (state) => state.selectedDate,
    selectedCountries: (state) => state.selectedCountries,
    countryColors: (state) => state.countryColors,
    dataByDate (state) {
      let result = [];
      for (let i = 0; i < state.data.length; i++) {
        if (state.selectedDate === state.data[i].date) {
          result.push(state.data[i])
        }
      }

      return result;
    },
  },
  actions: {
    loadData({state}) {

      return new Promise((resolve, reject) => {
        d3.csv('./owid-covid-data.csv').then((data) => {
          // Preprocessing
          // Remove items that start with OWID in their iso code, since these are cumulative values for continents etc.
          data = data.filter((item) => !item.iso_code.startsWith("OWID"));

          let countries = {};
          let dates = new Set();
          let features = new Set();
          data.forEach(function (d) {
            d.aged_65_older = +d.aged_65_older;
            d.aged_70_older = +d.aged_70_older;
            d.cardiovasc_death_rate = +d.cardiovasc_death_rate;
            d.diabetes_prevalence = +d.diabetes_prevalence;
            d.extreme_poverty = +d.extreme_poverty;
            d.female_smokers = +d.female_smokers;
            d.male_smokers = +d.male_smokers;
            d.gdp_per_capita = +d.gdp_per_capita;
            d.hospital_beds_per_thousand = +d.hospital_beds_per_thousand;
            d.human_development_index = +d.human_development_index;
            d.icu_patients = +d.icu_patients;
            d.icu_patients_per_million = +d.icu_patients_per_million;
            d.life_expectancy = +d.life_expectancy;
            d.median_age = +d.median_age;
            d.new_cases = +d.new_cases;
            d.new_cases_per_million = +d.new_cases_per_million;
            d.new_cases_smoothed = +d.new_cases_smoothed;
            d.new_cases_smoothed_per_million = +d.new_cases_smoothed_per_million;
            d.new_deaths = +d.new_deaths;
            d.new_deaths_per_million = +d.new_deaths_per_million;
            d.new_deaths_smoothed = +d.new_deaths_smoothed;
            d.new_deaths_smoothed_per_million = +d.new_deaths_smoothed_per_million;
            d.new_people_vaccinated_smoothed = +d.new_people_vaccinated_smoothed;
            d.new_people_vaccinated_smoothed_per_hundred = +d.new_people_vaccinated_smoothed_per_hundred;
            d.total_tests = +d.total_tests;
            d.total_tests_per_thousand = +d.total_tests_per_thousand;
            d.new_tests = +d.new_tests;
            d.new_tests_per_thousand = +d.new_tests_per_thousand;
            d.new_tests_smoothed = +d.new_tests_smoothed;
            d.new_tests_smoothed_per_thousand = +d.new_tests_smoothed_per_thousand;
            d.new_vaccinations = +d.new_vaccinations;
            d.new_vaccinations_smoothed = +d.new_vaccinations_smoothed;
            d.new_vaccinations_smoothed_per_million = +d.new_vaccinations_smoothed_per_million;
            d.people_fully_vaccinated = +d.people_fully_vaccinated;
            d.people_fully_vaccinated_per_hundred = +d.people_fully_vaccinated_per_hundred;
            d.people_vaccinated = +d.people_vaccinated;
            d.people_vaccinated_per_hundred = +d.people_vaccinated_per_hundred;
            d.population = +d.population;
            d.population_density = +d.population_density;
            d.positive_rate = +d.positive_rate;
            d.reproduction_rate = +d.reproduction_rate;
            d.stringency_index = +d.stringency_index;
            d.total_boosters = +d.total_boosters;
            d.total_boosters_per_hundred = +d.total_boosters_per_hundred;
            d.total_cases = +d.total_cases;
            d.total_cases_per_million = +d.total_cases_per_million;
            d.total_deaths = +d.total_deaths;
            d.total_deaths_per_million = +d.total_deaths_per_million;
            d.tests_per_case = +d.tests_per_case;
            d.total_vaccinations = +d.total_vaccinations;
            d.total_vaccinations_per_hundred = +d.total_vaccinations_per_hundred;
            d.weekly_hosp_admissions = +d.weekly_hosp_admissions;
            d.weekly_hosp_admissions_per_million = +d.weekly_hosp_admissions_per_million;
            d.weekly_icu_admissions = +d.weekly_icu_admissions;
            d.weekly_icu_admissions_per_million = +d.weekly_icu_admissions_per_million;
            d.date = new Date(new Date(d.date).toDateString()).getTime();

            Object.keys(d).forEach((f) => features.add(f));
            countries[d.iso_code] = d.location;
            dates.add(d.date);
          })
          Object.freeze(data);

          state.countriesDict = countries;
          state.dates = Array.from(dates);
          state.features = Array.from(features);
          for (let key in countries) {
            state.countries.push(key);
          }
          state.data = data;
          resolve();
        }, error => {
          reject(error);
        });

      });
    },
  }
})

export default store;
