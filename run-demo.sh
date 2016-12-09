#!/bin/bash
mvn -U clean install
mvn -f lazy-grid-vaadin6-demo/pom.xml jetty:deploy-war

