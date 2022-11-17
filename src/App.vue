<template>
  <div id="app" ref="app" class="container is-fluid is-fullheight">
    <div class="columns">
      <div class="column is-2">
        <div class="tile is-ancestor">
          <div class="tile is-vertical">
            <article class="tile notification is-child">
              <p class="title">{{totalInfections}}</p>
              <p class="subtitle">Total Infections</p>
            </article>
            <article class="tile notification is-child">
              <p class="title">{{totalDeaths}}</p>
              <p class="subtitle">Total Deaths</p>
            </article>
            <article class="tile notification">
              <SearchBox/>
            </article>
          </div>
        </div>
      </div>
      <div class="column is-10">
       <div class="columns">
         <div class="column is-7" style="height: 85vh;">
           <ChoroplethMap/>
         </div>
         <div class="column is-5">
           <section class="row" style="max-height: 50vh; height: 50%;">
             <Histogram/>
           </section>
           <section class="row" style="max-height: 50vh; height: 50%;">
             <Scatterplot/>
           </section>
         </div>
       </div>
        <div class="columns">
          <div class="column">
            <YearSlider/>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import * as d3 from "d3";
import Scatterplot from "@/components/Scatterplot";
import Histogram from "./components/Histogram";
import ChoroplethMap from './components/ChoroplethMap.vue';
import YearSlider from './components/YearSlider.vue';
import SearchBox from "./components/SearchBox";

export default {
  name: 'App',
  components: {
    SearchBox, Histogram,
    Scatterplot, ChoroplethMap, YearSlider
  },
  mounted() {
    const loadingComponent = this.$buefy.loading.open({
      container: this.$refs.app.$el
    });
    this.$store.dispatch('loadData').then(() => {
      loadingComponent.close();

      const that = this;
      setTimeout(function() {
        that.$buefy.snackbar.open({
          message: 'Try to select a few countries for a better overview',
          position: 'is-top',
          indefinite: true,
        });
      }, 3000);
    }, error => {
      console.log(error);
      this.$buefy.toast.open({
        duration: 5000,
        message: `Error loading the <a href="https://ourworldindata.org/coronavirus"><b>Our World in Data</b></a> dataset.`,
        position: 'is-bottom',
        type: 'is-danger'
      })
    });

  },
  methods: {

  },
  computed: {
    totalInfections: {
      get() {
        return d3.max(this.$store.getters.data, (d) => d['total_cases']);
      }
    },
    totalDeaths: {
      get() {
        return d3.max(this.$store.getters.data, (d) => d['total_deaths']);
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
html, body {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";
// Set your colors
$primary: #282525;//#8c67ef;
$primary-light: findLightColor($primary);
$primary-dark: findDarkColor($primary);
$primary-invert: findColorInvert($primary);
$twitter: #4099FF;
$twitter-invert: findColorInvert($twitter);

// Lists and maps
$custom-colors: null !default;
$custom-shades: null !default;

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: mergeColorMaps(
        (
            "white": (
                $white,
                $black,
            ),
            "black": (
                $black,
                $white,
            ),
            "light": (
                $light,
                $light-invert,
            ),
            "dark": (
                $dark,
                $dark-invert,
            ),
            "primary": (
                $primary,
                $primary-invert,
                $primary-light,
                $primary-dark,
            ),
            "link": (
                $link,
                $link-invert,
                $link-light,
                $link-dark,
            ),
            "info": (
                $info,
                $info-invert,
                $info-light,
                $info-dark,
            ),
            "success": (
                $success,
                $success-invert,
                $success-light,
                $success-dark,
            ),
            "warning": (
                $warning,
                $warning-invert,
                $warning-light,
                $warning-dark,
            ),
            "danger": (
                $danger,
                $danger-invert,
                $danger-light,
                $danger-dark,
            ),
        ),
        $custom-colors
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// Import Bulma and Buefy styles
@import "~bulma";
@import "~buefy/src/scss/buefy";
</style>
