from configparser import ConfigParser

config = ConfigParser()
assert config.read("config.ini") != [], "CONFIG FILE WAS NOT READED"


def read_local():
    config.read("config.local.ini")
