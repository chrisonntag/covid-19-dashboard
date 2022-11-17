# Interactive graphics – A3 submission sonntagc25

This project tries to display the correlation between the average yearly income per U.S. state and the 
corresponding ratio of educational attainment (Bachelor's degree or higher). At first, I used a red and blue 
pastell color palette, but quickly changed to a more green-based variant (incorporating blues as well), because
green is known for as a much more positive color. In addition to that, the colors are still easily distinguishable 
for people with protanopia, deuteranopia, or tritanopia.

![Generated with https://davidmathlogic.com/colorblind/](colorpalette.png "Used color palette as a perso with protanopia, deuteranopia, or tritanopia would see them.")

## Project setup
Yarn has been chosen as a package manager.

```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run serve
```

### Compiles and minifies for production
```
yarn run build
```

### Run your tests
```
yarn run test
```

### Lints and fixes files
```
yarn run lint
```

## Code structure
The code is built with and on top of the previous BarChart example component. Most data is handled by the Vuex store 
and accessed by all components, except for the coloring. 
After the data is loaded, processed and displayed by the scatter plot, the chosen colors (in dependence of the x and 
y axes) are published and updated by the ScatterPlot component and stored in the Vuex store, where the Map component 
crawls the new color values if something changes.

In this way, both components are mostly separated and the Map only depends on a color array, as big as an array 
containing all states.
