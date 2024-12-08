#!/bin/bash

# GraphHopper Setup and Start Script for Linux
# =============================================
# This script is used to start the GraphHopper routing server.
# For first-time setup, follow the installation instructions below (as comments).

# --------------------
# FIRST-TIME SETUP (Installation)
# --------------------
# 1. Clone the GraphHopper repository from GitHub:
#    git clone https://github.com/graphhopper/graphhopper.git ~/graphhopper
#    cd ~/graphhopper
#
# 2. Clean the Package
#    mvn clean package -DskipTests
#
# 3. Download the OpenStreetMap (OSM) file for your area:
#    wget https://download.geofabrik.de/europe/germany/karlsruhe-regbez-latest.osm.pbf -O karlsruhe-regbez-latest.osm.pbf
#    (This example uses Karlsruhe test data. Replace this file with your desired region as needed.)
#
# 4. (Optional) Download GTFS data for public transport (if needed):
#    wget https://example.com/path/to/karlsruhe_transit.zip -O karlsruhe_transit.zip
#
# 5. Adjust the configuration file `karlsruhe-config.yml` as needed:
#    The default example configuration is set for Karlsruhe data. If you are using other data, update:
#      - `datareader.file` to match your OSM file
#      - `gtfs.file` (if using public transport) to your GTFS file path
#
# 6. Import the graph data (required before starting the server):
#    java -jar web/target/graphhopper-web-*.jar import config.yml

# --------------------
# STARTING THE SERVER
# --------------------
# This script assumes the setup is already complete.

# If not running in a terminal, open this script in a terminal
if [ -z "$TERM" ]; then
    gnome-terminal -- bash -c "$0; exec bash"
    exit
fi

# Set variables
GRAPHOPPER_DIR="/home/user/graphhopper"  # Update this directory if your GraphHopper is in a different location.
GRAPHOPPER_JAR="/home/user/graphhopper/web/target/graphhopper-web-11.0-SNAPSHOT.jar"  # Update this path if the JAR file is located elsewhere.
CONFIG_FILE="$GRAPHOPPER_DIR/reader-gtfs/karlsruhe-config.yml"  # Update this to your actual config file path if different.

# Check if required files exist
if [ ! -f "$GRAPHOPPER_JAR" ]; then
    echo "Error: GraphHopper JAR file not found. Please follow the setup instructions above."
    exit 1
fi
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found. Please ensure 'karlsruhe-config.yml' exists and is correctly configured."
    exit 1
fi

# Start the GraphHopper server
echo "Starting GraphHopper server..."
cd "$GRAPHOPPER_DIR"
java -Xmx4g -jar $GRAPHOPPER_JAR server $CONFIG_FILE
