<template>
  <section class="search-container">
    <b-field custom aria-role="listitem">
      <b-input v-model="searchTerm" placeholder="Search ..." expanded style="width: 100%;" />
    </b-field>

    <div class="cards-container">
      <b-collapse
          v-for="item of filteredData" :key="item" :value="item"
          :open="isOpen === item"
          @open="isOpen = item"
          class="card"
          animation="slide"
          :aria-id="item+'_card'">
        <template #trigger="props">
          <div
              class="card-header"
              role="button"
              :aria-controls="item+'_card'">
            <p class="card-header-title">
              <b-checkbox size="is-small" v-model="selectedOptions" :native-value="item">
                {{ countryNameDict[item] }}
              </b-checkbox>
            </p>
            <a class="card-header-icon">
              <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
            </a>
          </div>
        </template>

        <div class="card-content">
          <div class="content">
            <table class="dataTable">
              <tr v-for="c of countryData[item]" :key="c">
                <td>{{c.feature}}</td>
                <td>{{c.value}}</td>
              </tr>
            </table>
          </div>
        </div>
      </b-collapse>
    </div>
  </section>
</template>

<script>
import * as d3 from "d3";

export default {
  name: 'SearchBox',
  props: {
  },
  data() {
    return {
      isOpen: 'GER',
      searchTerm: '',
    }
  },
  mounted() {
  },
  methods: {
    updateSelectedOptions() {
    },
  },
  computed: {
    countryData() {
      let results = {}
      this.$store.getters.dataByDate.forEach((country) => {
        results[country["iso_code"]] = [];
        results[country["iso_code"]].push(
            {feature: 'Stringency Index', value: country["stringency_index"]},
            {feature: 'Population', value: d3.format("~s")(country["population"])},
            {feature: 'Population Density (per km2)', value: country["population_density"]},
            {feature: 'Median Age', value: country["median_age"]},
            {feature: 'GDP per Capita', value: country["gdp_per_capita"]},
            {feature: 'Hospital Beds per K', value: country["hospital_beds_per_thousand"]},
            {feature: 'Aged >= 70 (%)', value: country["aged_70_older"]},
            )
      })

      return results;
    },
    filteredData() {
      return this.options.filter((item) => this.countryNameDict[item].toLowerCase().indexOf(this.searchTerm.toLowerCase()) >= 0);
    },
    selectedOptions: {
      get() {
        return this.$store.getters.selectedCountries;
      },
      set(selected) {
        this.$store.commit("cleanSelectedCountries");
        selected.forEach(option => {
          this.$store.commit('changeSelectedCountry', option);
        });
      }
    },
    countryNameDict: {
      get() {
        return this.$store.getters.countryNameDict;
      }
    },
    options: {
      get() {
        return this.$store.getters.countries;
      }
    },
  },
  watch: {
    selectedOptions: {
      handler() {
        this.updateSelectedOptions();
      },
    },
  },
}
</script>

<style>
.dataTable {
  font-size: 0.7rem;
  text-align: left;
  margin: 0;
  padding: 0;
}
.search-container {
  height: 100%;
  position: relative;
}
.cards-container {
  max-height: 450px;
  overflow: scroll;
  max-width: 100%;
}
.card {
  margin-bottom: 12px !important;
  box-shadow: none !important;
}

.card-content {
  padding: 0.7rem;
}
</style>
