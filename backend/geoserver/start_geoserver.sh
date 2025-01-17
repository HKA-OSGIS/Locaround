#!/bin/bash

# Navigate to GeoServer's bin directory
cd /usr/share/geoserver/bin || { echo "Failed to navigate to /usr/share/geoserver/bin"; exit 1; }

# Set GeoServer environment variables
export GEOSERVER_HOME=/usr/share/geoserver
export GEOSERVER_DATA_DIR=/usr/share/geoserver/data_dir

# Start GeoServer
sh startup.sh

# Wait a few seconds to ensure GeoServer has time to start
sleep 10

# Open GeoServer in the default web browser
xdg-open http://localhost:8080/geoserver
