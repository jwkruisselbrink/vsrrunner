# VSRRunner: R script runner extension for Visual Studio Code

VSRRunner is a very simple VS code extension built on top of Yuki Ueda's [VS Code R extension](https://marketplace.visualstudio.com/items?itemName=Ikuyadeu.r) with a shortcut for running R scripts in Visual Studio Code. It runs R scripts and writes the output to .Rout files that are opened on completion. It also includes a command to quickly switch between R scripts and their output and a command to copy tables in R output to clipboard as semicolon delimited strings.

Requires [R](https://www.r-project.org/) and [VS Code R extension](https://marketplace.visualstudio.com/items?itemName=Ikuyadeu.r).

## Features

* Run R scripts (F12).
* Switch between R scripts and R output files (Alt+n).
* Copy tables in R output to clipboard as semicolon delimited strings (Ctrl+Shift+c).

### Supported platforms

* Windows x64
