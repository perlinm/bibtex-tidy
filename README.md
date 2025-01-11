# bibtex-tidy

Tidy bibtex files. [Try it out](https://flamingtempura.github.io/bibtex-tidy/).

![Screen Recording 2020-10-23 at 16 25 26(1)](https://user-images.githubusercontent.com/1085434/97023051-dcbcf180-154c-11eb-9185-6f6de7c2fc68.gif)

There are several ways you can use bibtex-tidy:
* [In your browser](https://flamingtempura.github.io/bibtex-tidy/)
* [CLI](#sec-cli)
* [As a pre-commit-hook](#sec-precommit)
* [Javascript/Typescript API](#sec-api)
* [Docker](#sec-docker)

## Example

Before:

```bibtex
@ARTICLE {feinberg1983technique,
  title={A technique for radiolabeling DNA restriction endonuclease fragments to high specific activity},
author={Feinberg, Andrew P. and Vogelstein, Bert},
  journal    = {Analytical biochemistry},
  volume = 132,
  number=1,
  pages={6--13},
  year=1983,
  publisher={Elsevier},}
@article{miles1984qualitative,
    title={Qualitative data analysis: A sourcebook},
    author={Miles, Matthew B. and Huberman, A. Michael and Saldana, J.},
    journal={Beverly Hills},
    year=1984
}
```

After `bibtex-tidy references.bib`:

```bibtex
@article{feinberg1983technique,
  title         = {A technique for radiolabeling DNA restriction endonuclease fragments to high specific activity},
  author        = {Feinberg, Andrew P. and Vogelstein, Bert},
  year          = 1983,
  journal       = {Analytical biochemistry},
  publisher     = {Elsevier},
  volume        = 132,
  number        = 1,
  pages         = {6--13}
}
@article{miles1984qualitative,
  title         = {Qualitative data analysis: A sourcebook},
  author        = {Miles, Matthew B. and Huberman, A. Michael and Saldana, J.},
  year          = 1984,
  journal       = {Beverly Hills}
}
```

<a name="sec-cli"></a>

## CLI

Requires node v12 or later.

```sh
npm install -g bibtex-tidy
bibtex-tidy references.bib
```

```manpage
  --help, -h
      Show help
      
  --v2
      Input files will no longer be modified by default. Instead, you will need to
      specify `--modify`/`-m` option to overwrite the file, or `--output`/`-o` to
      output to a different file.
      
  --output, -o
      Write output to specified path. When omitted (and -m/--modify is not used),
      the result will be printed to stdout.
      
  --modify, -m, --no-modify
      Overwrite the original input files with the tidied result. This is enabled by
      default but will be disabled by default in v2. For v1, use --no-modify to
      output to stdout instead of overwriting the input files.
      
  --omit
      Remove specified fields from bibliography entries.
      
      Examples:
      --omit=id,name
      
  --curly, --no-curly
      Enclose all property values in braces. Quoted values will be converted to
      braces. For example, "Journal of Tea" will become {Journal of Tea}.
      
  --numeric, --no-numeric
      Strip quotes and braces from numeric/month values. For example, {1998} will
      become 1998.
      
  --months
      Convert all months to three letter abbreviations (jan, feb, etc).
      
  --space
      Indent all fields with the specified number of spaces. Ignored if tab is set.
      
      Examples:
      --space=2 (default), --space=4
      
  --tab, --no-tab
      Indent all fields with a tab.
      
  --align, --no-align
      Insert whitespace between fields and values so that values are visually
      aligned.
      
      Examples:
      --align=14 (default)
      
  --blank-lines, --no-blank-lines
      Insert an empty line between each entry.
      
  --sort, --no-sort
      Sort entries by the specified field names (citation key is used if no fields
      are specified). For descending order, prefix the field with a dash (-).
      
      Multiple fields may be specified to sort everything by first field, then by
      the second field whenever the first field for entries are equal, etc.
      
      The following additional fields are also permitted: key (entry citation key),
      type (sorts by the type of entry, e.g. article), and special (ensures that
      @string, @preamble, @set, and @xdata entries are first).
      
      Examples:
      --sort (sort by citation key), --sort=-year,name (sort year descending then
      name ascending), --sort=name,year
      
  --duplicates
      Warn if duplicates are found, which are entries where DOI, abstract, or
      author and title are the same.
      
      Examples:
      --duplicates doi (same DOIs), --duplicates key (same IDs), --duplicates
      abstract (similar abstracts), --duplicates citation (similar author and
      titles), --duplicates doi, key (identical DOI or keys), --duplicates (same
      DOI, key, abstract, or citation)
      
  --merge, --no-merge
      Merge duplicates entries. Use the duplicates option to determine how
      duplicates are identified. There are different ways to merge:
      
      - first: only keep the original entry
      
      - last: only keep the last found duplicate
      
      - combine: keep original entry and merge in fields of duplicates if they do
      not already exist
      
      - overwrite: keep original entry and merge in fields of duplicates,
      overwriting existing fields if they exist
      
  --strip-enclosing-braces
      Where an entire value is enclosed in double braces, remove the extra braces.
      For example, {{Journal of Tea}} will become {Journal of Tea}.
      
  --drop-all-caps
      Where values are all caps, make them title case. For example, {JOURNAL OF
      TEA} will become {Journal of Tea}. Roman numerals will be left unchanged.
      
  --escape, --no-escape
      Escape special characters, such as umlaut. This ensures correct typesetting
      with latex. Enabled by default.
      
  --sort-fields
      Sort the fields within entries.
      
      If no fields are specified fields will be sorted by: title, shorttitle,
      author, year, month, day, journal, booktitle, location, on, publisher,
      address, series, volume, number, pages, doi, isbn, issn, url, urldate,
      copyright, category, note, metadata
      
      Examples:
      --sort-fields=name,author
      
  --strip-comments, --no-strip-comments
      Remove all comments from the bibtex source.
      
  --trailing-commas, --no-trailing-commas
      End the last key value pair in each entry with a comma.
      
  --encode-urls, --no-encode-urls
      Replace invalid URL characters with percent encoded values.
      
  --tidy-comments, --no-tidy-comments
      Remove whitespace surrounding comments.
      
  --remove-empty-fields, --no-remove-empty-fields
      Remove any fields that have empty values.
      
  --remove-dupe-fields, --no-remove-dupe-fields
      Only allow one of each field in each entry. Enabled by default.
      
  --generate-keys
      For all entries replace the key with a new key of the form
      <author><year><title>. A JabRef citation pattern can be provided. This is an
      experimental option that may change without warning.
      
  --max-authors
      Truncate authors if above a given number into "and others".
      
  --no-lowercase
      Lowercase field names and entry type. Enabled by default.
      
  --enclosing-braces
      Enclose the given fields in double braces, such that case is preserved during
      BibTeX compilation.
      
      Examples:
      --enclosing-braces=title,journal (output title and journal fields will be of
      the form {{This is a title}}), --enclosing-braces (equivalent to
      ---enclosing-braces=title)
      
  --remove-braces
      Remove any curly braces within the value, unless they are part of a command.
      
      Examples:
      --remove-braces=title,journal, --remove-braces (equivalent to
      ---remove-braces=title)
      
  --wrap, --no-wrap
      Wrap long values at the given column
      
      Examples:
      --wrap (80 by default), --wrap=82
      
  --version, -v
      Show bibtex-tidy version.
      
  --quiet
      Suppress logs on stdout.
      
```

<a name="sec-api"></a>

## Javascript/Typescript API

```
npm install bibtex-tidy
```

```js
const tidy = require('bibtex-tidy');
const bibtex = fs.readFileSync('references.bib', 'utf8');
tidy.tidy(bibtex, { curly: true });
```

Documentation for the options can be found [here](https://github.com/FlamingTempura/bibtex-tidy/blob/master/src/__generated__/optionsType.ts)

<a name="sec-precommit"></a>

## Pre-Commit Hook

If you keep your bibtex files in a git repository, you can run bibtex-tidy each time you commit using [pre-commit](https://pre-commit.com/):

```yaml
repos:
-   repo: https://github.com/FlamingTempura/bibtex-tidy
    rev: v1.14.0 # see changelog for latest version
    hooks:
    -   id: bibtex-tidy
        args: ['--align=100', '--curly'] # any other settings
```

<a name="sec-docker"></a>

## Docker

The web application can be deployed locally using the provided Docker configuration:

1. Build and start the container: `docker compose -f docker/docker-compose.yml up`
2. Visit the web application at http://localhost:8080 and do your BibTeX work
