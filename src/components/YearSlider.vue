<template>
  <div>
    <b-field message="Date Selection" label="Date">
      <b-slider indicator :custom-formatter="val => new Date(val).toLocaleDateString()" :tooltip="false" size="is-medium" :min="minDate" :max="maxDate" v-model="selectedDate">
        <template v-for="val in ticks">
          <b-slider-tick :value="val" :key="val">{{ new Date(val).toLocaleDateString() }}</b-slider-tick>
        </template>
      </b-slider>
    </b-field>
  </div>
</template>

<script>
export default {
  name: 'YearSlider',
  props: {
  },
  data() {
    return {
    }
  },
  mounted() {
  },
  methods: {
  },
  computed: {
    minDate: {
      get() {
        return Math.min.apply(null, this.dates);
      }
    },
    maxDate: {
      get() {
        return Math.max.apply(null, this.dates);
      }
    },
    ticks: {
      get() {
        let ticks = [];
        for(let i = 0; i < this.dates.length; i++) {
          if (i % 90 === 0) {
            ticks.push(this.dates[i]);
          }
        }

        return ticks;
      }
    },
    dates: {
      get() {
        return this.$store.getters.dates;
      }
    },
    selectedDate: {
      get() {
        return this.$store.getters.selectedDate;
      },
      set(val) {
        // Stripping time is needed again because the Slider UI creates a continuous scale between min time in millis
        // and max time in millis.
        let stripped_date = new Date(new Date(val).toDateString()).getTime();
        this.$store.commit('changeSelectedDate', stripped_date);
      },
    },
  },
  watch: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
