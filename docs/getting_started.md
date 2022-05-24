# Getting started

## Install

> **INFORMATION:**
>
> sometimes the command `python3` isn't defined. Try one of these alternatives: `py`,`python`. Check the version with `--version` (you need at least python 3.6).

1. Download [Python 3](https://www.python.org/downloads/)
2. Download this [repository](https://github.com/DoctorFuchs/DnDLIB)
3. Install the requirements: `python3 -m pip install -r requirements.txt`
4. Run the server with `python3 -m server`
5. Now enjoy our app! 

## Configuration
```
[APP]
name = Name of the app
description = Description of the app

[SERVER]
port= An integer on which port the server will run
hostname= An IP-Adress on which the server will run
debug = Debug option: ONLY USE THIS IN DEVELOPMENT

[API]
hostname = extern API URL. If you have a local api you can change it here :D
```

## What is the config.local.ini?

This is a second config, that can be applied with the `-l` option. This config is used to switch between api self hosting (with option `-l`) and development (default)  