# CustomCodeHighlightingExtension

**DISCLAIMER: This project is WIP so substantial changes are expected in future iterations!**

A small (firefox) browser extension to add custom highlighting to markdown snippets inside the readme file on github
repository pages.


## Examples

```custom:highlighting/sub/lang3
this is a simple syntax highlighting extension!
```

Not interfering with existing syntax highlighting:

```py
if __name__ == "__main__":
    print("Hello world!")
```

Allows multiple custom syntax highlightings in the same markdown file:

```custom:highlighting/lang1
this is a custom language
```

```custom:highlighting/lang2
a totally different custom language
```

This is minimal highlighting for java:

```custom:highlighting/similar-to-java
public class Main
{
    public static void main(String[] args)
    {
        System.out.println("Hello world!");
    }
}
```

# How it works

This plugin is using the lang attribute inside the html dom to locate markdown snippets that have not been converted by
github.
Using the attribute the extension will load the required highlighting files (from the highlighting directory).
After loading the files the text of every snippet is colored according to the tokens defined in the file.

The specification of the syntax highlighting is done using files in which every row represents an entry.
Every entry consists of three parts: `<name> <color> <regex>`.
One example is `keyword "#abcdef" "(this|or|that)"`.
To use it the language of the snippet needs to be `custom:` followed by the path of the syntax file your name of choice relative to the root of the repo.
The name of the file must be your name of choice and end with `.high` (of course located in the desired path used in the snippet setting).

*Note: The algorithm used to tokenize and color the text is super simple and inefficient, but it should work fine for
smallish snippets.*