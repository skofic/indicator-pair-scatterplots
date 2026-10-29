# Indicator pair scatterplots

This repository can be used to create the data used to produce indicator pair scatterplots. The idea is to consider, for instance, the temperature and precipitation indicators pair, by generating data for three main layers:

- *Base*. This layer will provide the base upon which the other two layers will be projected, it represents the temperature and precipitation values extent for the observation area. We use here [Chelsa](https://chelsa-climate.org) as the indicator data source.
- *Species*. This layer comes from the [EU-Forest](https://www.nature.com/articles/sdata2016123) high-resolution tree occurrence dataset, the location of the specific species is crossed with the [Chelsa](https://chelsa-climate.org) climate grid to provide a layer that characterises the indicators pair for each species. The layer represents the species occurrences in relation to the pair of indicators and would be superposed over the base layer. This allows us to see how the species occurrences are positioned in relation to the climatic base formed by the indicators pair.
- *Units*. This layer comes from the location of the [EUFGIS](http://www.eufgis.org) conservation units and it represents the topmost layer in the scatterplot. By placing the conservation units over the species distribution we have an idea of where these units are in relation to the core of the species occurrences.

The final product will be an [ArangoDB](https://arangodb.com) database containing a series of collections, each representing a single layer and data source.

## Scripts

The scripts to compile these collections are divided into two types:

- Javascript scripts will clear, create and setup indexes for the required collections.
- Shell scripts will perform the necessary queries.

This was decided after testing: for some unknown reason (at least for now) long lasting queries launched using javascript would invariably fail due to a timeout. I tried to no avail increasing the timeout for queries and connections, when the query became too long there always was a timeout that interrupted the script. The actual query did eventually finish and produce data, but I could not trust this behaviour. This may have to do with Node.js, but I still haven't found a fix. Also the shell scripts failed, sometimes, with timeouts, but they also succeeded, so that was the safest path.

## Data

In order to create the collections we need three main sets of data:

- [Chelsa](https://chelsa-climate.org). This collection will be used to get indicator data. I will not explain how to create the data, this can be found in [the following](https://github.com/skofic/ClimateService) repository, a more detailed READ.ME can be found [here](https://github.com/skofic/environmental-services). Note that you will have to index all indicators that you wish to use, or it will take forever and even more.
- [EU-Forest](https://figshare.com/collections/A_high-resolution_pan-European_tree_occurrence_dataset/3288407). The two datasets we use are the tree occurrences at [genus](https://figshare.com/articles/dataset/Tree_occurrences_at_genus_level/3497888?backTo=/collections/A_high-resolution_pan-European_tree_occurrence_dataset/3288407) level and the tree occurrences at the [species](https://figshare.com/articles/dataset/Tree_occurrences_at_species_level/3497885?backTo=/collections/A_high-resolution_pan-European_tree_occurrence_dataset/3288407) level. In the `RUN-INIT.js` script we process these files, so you will need to correct the location of these files.
- EUFGIS. This set of collections cover the following data (some information on the data is available [here](https://github.com/skofic/environmental-services)):
  - *Shapes*. The collection containing the individual conservation unit GeoJSON shapes.
  - *UnitPolygons*: A collection linking shapes to conservation unit numbers.

## Workflow

The first step is to get [Chelsa](https://chelsa-climate.org), the two [EU-Forest](https://figshare.com/collections/A_high-resolution_pan-European_tree_occurrence_dataset/3288407) files and the EUFGIS conservation units data. The first and last of these will be in the form of ArangoDB collections named: `Chelsa`, `Shapes` and `UnitPolygons`.

The second step consists in creating the required collections to link the EU-Forest and conservation unit data to the Chelsa climate grid. You run the `RUN-INIT.js` script that will perform the following operations:

- Create all required collections and indexes.
- Iterate EU-Forest files and create the respective genus and species collections.

After this step we need to create the full resolution combination of EU-Forest data with Chelsa and EUFGIS conservation units with Chelsa. This will be done by running the `RUN-INIT.sh` script that can be found in the `scripts` directory.

At the end of this step we have everything we need to tackle indicator pairs.

The first thing is to identify which indicator to use for the X axis and which other for the Y axis. Currently the pairs are defined in the globals `globals.localhost.js` script under the pairs property. Each top level block contains the name of the indicators pair and the list of collections to create.

The pair collections are named as follows: `<pair prefix>_<dataset>_<full or round>`:

- The `pair prefix` is a code that uniquely identifies the pair, it is used whenever one needs to reference the pair.
- The `dataset` can take three values:
  - `chelsa` will indicate that the collection contains chelsa data for the indicator pairs.
  - `eu` will indicate that the collection contains EU-Forest species data for the indicator pairs.
  - `eufgis` will indicate that the collection contains EUFGIS conservation units data for the pair.
- The last part of the name can take two values:
  - `full` means that the data is full resolution.
  - `round` means that the data was rounded to reduce the number of unique values.

All pair collections are structured as follows:

- `_key`: The record key is the hash of the indicator pair values.
- `count`: This property contains the number of records, from the original dataset, referenced by the specific pair of values. For instance, taking Chelsa as an example, if we have a specific temperature and precipitation combination, it is possible that this combination matches several chelsa grid elements: their count goes into this property. This can be used to provide a weight to each pair of values which can be used to create a heat map.
- `properties`:  This property will contain the pair of indicator values.

The above structure is related to Chelsa data, EU-Forest and EUFGIS data contain respectively the following additional properties:

- *EU-Forest* Records will feature the `species_list` property that contains the list of species for that indicators pair.
- *EUFGIS* records will feature two additional properties: `gcu_id_number_list` contains the list of unit numbers matching the combination and `gcu_id_unit-id_list` contains the list of unit IDs matching the combination.

In order to create the collections you would run the `RUN-PAIR.js` script. This script will create the collections for all pairs.

In order to load the pair data you will run the `RUN-PAIR.sh` script with the following parameters:

- Pair key. This corresponds to the `key` property of the pair block described above.
- X-axis indicator name.
- Y-axis indicator name.

The result of this process will be three collections, one for Chelsa, one for EU-Forest and one for EUFGIS that will contain the available combinations of the two indicators at the maximum resolution. The postfix for all these collections will be `_full`.

The problem with this is that the number of points can be overwhelming: for instance temperature and precipitation for Chelsa results in over 27 million points. This means that in order to create scatter plots we need to reduce the number of points in each level: to do so we use the RUN-PAIR-FINAL.sh script to create new collections with less points, these collections will have a postfix of `_round`. The script is invoked by providing the following parameters:

- Pair key. This corresponds to the `key` property of the pair block described above.
- X-axis indicator name.
- Y-axis indicator name.
- X-axis interval.
- Y-axis interval.

The last two parameters represent the interval between values: for instance if we have 10 values from 1 to 10, an interval of 1 would end in a list of 10 values, no change, if the interval is 2 this will result in 5 points with aggregated values.

The structure of the data is the same as for the full resolution version, except that the `count` parameter will have the cumulated number of records.

In order to use this script you must have run before the `RUN-PAIR.sh` script to generate the full resolution data.

There is a useful collection, *Stats*, which contains statistics for all data iterations, *info by record key*:

- `Chelsa`: Minimum, average and maximum value for each selected indicator from the Chelsa dataset.
- `EU-Forest`: Minimum, average and maximum value for each selected indicator from the EU-Forest dataset.
- `EUFGIS`: Minimum, average and maximum value for each selected indicator from the EUFGIS dataset.
- `Species`: The list of species from EU-Forest.
- *One record for each indicator pair collection*. These records contain the following properties:
  - `items`: This section covers the number of records:
    - `count`: The total number of points.
    - `weights`: The minimum and maximum values of the count property of the collection.
  - *One section for each indicator*:
    - `count`: Number of unique values.
    - `weights`: Minimum, average and maximum value.

If you only need the data for the scatterplots you can keep only the `_round` pair collections and ignore everything else.

If you plan to generate different resolution pair data you will need the `_full` version of the pair collection.

If you want other indicators you will need everything. Note that all used indicators will have to be indexed in Chelsa, since we do many aggregations.