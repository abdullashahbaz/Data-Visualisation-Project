# Olympics & GDP Data Story

An interactive, one-page data story exploring the relationship between national wealth and Olympic success.

The project combines **56 years of Summer Olympic results (1960–2016)** with World Bank GDP data to investigate whether wealthier countries win more medals, identify nations that outperform their economic position and show how Olympic dominance has changed over time.

## Research Question

> To what extent does national wealth explain Olympic success?

The visualisations explore the relationship between GDP per capita, medal totals, athlete participation and historical medal-table rankings.

## Key Features

- Four interactive and connected D3.js visualisations
- Country selection across multiple charts
- Medal and GDP filtering
- Interactive tooltips
- Zooming and panning
- Animated chart transitions
- Responsive single-page layout
- Historical annotations for major Olympic events

## Visualisations

### 1. GDP vs Total Medals

A bubble chart comparing each country's average GDP per capita with its total Olympic medal count.

- **Horizontal axis:** Average GDP per capita
- **Vertical axis:** Total medals won
- **Bubble size:** Number of athlete entries

The chart helps identify wealthy Olympic powers and lower-income countries that perform above expectations.

### 2. Medal Efficiency Map

A choropleth world map showing the number of medals won relative to GDP per capita.

Countries with a higher medal-efficiency score are shown more prominently, highlighting nations that achieve strong Olympic results despite having fewer economic resources.

### 3. Medals and GDP Over Time

A dual-axis timeline showing the selected country's medal performance and GDP per capita across each Summer Olympic Games.

Selecting a country from the bubble chart, map or dropdown automatically updates the timeline.

### 4. Olympic Medal Rank Over Time

A bump chart showing how the medal-table rankings of the top 15 Olympic nations changed between 1960 and 2016.

The chart also highlights the:

- 1980 Moscow Olympic boycott
- 1984 Los Angeles Olympic boycott
- Dissolution of the Soviet Union
- Rise of China as an Olympic power

## Interactions

Users can:

- Select a country using the dropdown
- Click a bubble, map region or bump-chart line
- Hover over visual elements for more information
- Filter countries by medal count
- Filter countries by GDP per capita
- Zoom and pan across the bubble chart and map
- Clear the current selection to return to the global view

All four visualisations share the same application state, allowing selections to update across the complete data story.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- D3.js v7
- SVG
- Python and Jupyter Notebook for data preparation

## Data Sources

### Olympic Athletes and Results

Historical Olympic athlete and event records were obtained from the Kaggle **120 Years of Olympic History** dataset.

[View the Olympic dataset](https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results/data)

### GDP per Capita

Annual GDP-per-capita data was obtained from the World Bank.

[View the World Bank dataset](https://data.worldbank.org/indicator/NY.GDP.PCAP.CD)

The datasets were cleaned and merged using country codes and Olympic years. Smaller summary files were then generated for use by the browser visualisations.

## Project Structure

```text
Data-Visualisation-Project/
├── index.html
├── styles/
│   ├── main.css
│   └── charts.css
├── script/
│   ├── state.js
│   ├── utils.js
│   ├── bubble.js
│   ├── map.js
│   ├── bump.js
│   ├── timeline.js
│   ├── controls.js
│   └── main.js
├── data/
│   ├── summary_countryGDP.csv
│   ├── yearly_medals.csv
│   └── processed data/
├── libs/
│   └── d3/
├── notebook/
│   ├── Data_Merge.ipynb
│   ├── EDA.ipynb
│   └── country.ipynb
└── docs/
    ├── architecture.md
    ├── dataSources.md
    └── user-guide.md
```

## How to Run

Clone the repository:

```bash
git clone https://github.com/abdullashahbaz/Data-Visualisation-Project.git
cd Data-Visualisation-Project
```

Start a local web server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Alternatively, open the project in Visual Studio Code and run `index.html` using the **Live Server** extension.

> An internet connection is required for the world map because its GeoJSON file is loaded from a public online source.

## Documentation

- [Application Architecture](docs/architecture.md)
- [User Guide](docs/user-guide.md)
- [Data Sources](docs/dataSources.md)

## Academic Context

Developed for the **F20DV Data Visualisation and Analytics** course at Heriot-Watt University, Dubai Campus.

## Submission Note

This repository contains the application source code, processed datasets, notebooks and supporting documentation.
