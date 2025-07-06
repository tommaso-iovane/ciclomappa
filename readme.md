# Ciclomappa

A simple JavaScript web app that displays [OpenCycleMap](https://www.opencyclemap.org/) tiles and adds real-time GPS tracking and navigation features.

## Gettings Started

1. Signup and get your api key from https://www.thunderforest.com/maps/opencyclemap/

2. Run the container
Change 3002 with your desired port and set your api key.

From dockerhub:
```sh
docker run -p 3002:80 -e API_KEY="xxxxxxxxx" tiovane/ciclomappa:latest
```

Or build locally:
```sh
git clone https://github.com/yourusername/ciclomappa.git
docker build -t ciclomappa .
docker run -p 3002:80 -e API_KEY="xxxxxxxxx" ciclomappa
```



