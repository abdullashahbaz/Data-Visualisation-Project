# Data Sources

##  Dataset 1: Olympic Athletes & Results
- Source: Kaggle / Olympic History dataset
- URL: https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results/data

- License: CC0: Public Domain

- Description: Historical records of all Olympic Games from 1896 to 2016, including athlete demographics, events, and medal results.

- Attributes (15): ID, Name, Sex, Age, Height, Weight, Team, NOC, Games, Year, Season, City, Sport, Event, Medal

- Structure: 271,116 athlete-event records with temporal (Year, Season), categorical (Sport, Medal, Team), and numerical (Age, Height, Weight) data.

- Complexity: Hierarchical (Sport, Discipline, Event) and geographical (Country/Team).


##  Dataset 2: GDP per Capita
- Source: World Bank
- URL: https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?end=2024&start=1960&view=chart

- License: CC BY-4.0

- Description: Yearly GDP per capita for all countries from 1960 to 2024.

- Attributes: Country Name, Country Code (ISO), Indicator Name, Year columns (1960–2024) with GDP values.

- Structure: Wide-format time series data.

- Complexity: Temporal-economic data


##  Data Processing Summary
- Cleaned Olympic medal fields
- Merged NOC/region information
- Standardised country codes
- Converted GDP data from wide to long format
- Merged both datasets by country code and year
- Created frontend summary files for visualisations
