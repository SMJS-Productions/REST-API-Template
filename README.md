# REST API Template

This repository functions as a general REST API standard template written in Typescript using Express.js along with auto generated documentations.

## Usage

This application relies on a lot of automated generation. Thus you'll need to configure some files before you work on the code.

Before doing anything, you'll need to define the structure of the API. You can do this by opening the [structure config file](structure.json) and defining the endpoints using the schema documented in [structuring](#structuring). Once you've define the structure, you can completely prepare the environment by running `npm i`. You compile the application and generate the interface for [the settings](settings.json) by running `npm run build`. You can generate a new version of the documentations to load any changes in the [structure config file](structure.json) by running `npm run generate`. Be aware that the structure generator will only generate the code templates for all the newly added endpoints and the documentations. If you want to run the API, simply run `npm start`.

## Structuring

The structure starts with an object defining the endpoints and a reference to the schema for IDE purposes.

| Key       | type                  | Description                           |            |
|-----------|-----------------------|---------------------------------------|------------|
| $schema   | `string`              | The JSON schema for the API structure | *Required* |
| endpoints | [Endpoint](#endpoint) | A list of endpoints used by the API   | *Required* |

### Endpoint

An endpoint definition specifying the request format and response format.

|Key          |Type                                     |Description                                                      |          |
|-------------|-----------------------------------------|-----------------------------------------------------------------|----------|
|method       |`string`                                 |The HTTP method of the endpoint                                  |*Required*|
|path         |`string`                                 |The URL path of the endpoint using the express.js variable syntax|*Required*|
|description  |[description](#types)                    |A brief description about the endpoint                           |*Required*|
|version      |`integer`                                |The API version of this endpoint                                 |*Optional*|
|headers      |`Record<...,`[description](#types)`>`    |A list of the headers required for the request                   |*Optional*|
|url_params   |`Record<...,`[description](#types)`>`    |A list of the parameters used in the URL                         |*Optional*|
|query_params |`Record<...,`[description](#types)`>`    |A list of the parameters used in the URL query                   |*Optional*|
|return_body  |[definition](#types)                     |The structure of the body sent back by the endpoint              |*Optional*|
|post_body    |[definition](#types)                     |The structure of the body sent in the POST request               |*Optional*|
|definitions  |[Object Definition](#object-definition)[]|The structure of the body sent in the POST request               |*Optional*|

### Array Definition

A list defining object implementations stored as an array.

|Key  |Type                                   |Description                                           |          |
|-----|---------------------------------------|------------------------------------------------------|----------|
|`0`  |[Type Definition](#type-definition)    |Declaring the type and info about the array definition|*Required*|
|`...`|[Object Definition](#object-definition)|The structure of the objects stored in the array      |*Required*|

### Type Definition

An object defining a type implementation.

|Key        |Type                                     |Description                                                           |          |
|-----------|-----------------------------------------|----------------------------------------------------------------------|----------|
|type       |`string` or `string[]`                   |The type being implemented                                            |*Required*|
|description|[description](#types)                    |A brief description about the type implementation                     |*Required*|
|optional   |`boolean`                                |This type can be undefined                                            |*Optional*|
|partial    |`boolean`                                |If the type is a partial type where every field is considered optional|*Optional*|
|optional   |`boolean`                                |This type can be undefined                                            |*Optional*|
|enum       |`Record<...,`[Enum Field](#enum-field)`>`|An object defining an enumeration implementation                      |*Optional*|

### Enum Field

A field giving information about a field in an enumeration.

|Key        |Type                             |Description                                     |          |
|-----------|---------------------------------|------------------------------------------------|----------|
|value      |`string` or `integer` or `double`|The value assigned to the enum field            |*Required*|
|description|[description](#types)            |A brief description about the usage of the field|*Required*|

### Object Definition

An object defining an object implementation.

|Key  |Type                       |Description                   |          |
|-----|---------------------------|------------------------------|----------|
|$info|[Object Info](#object-info)|All info about the object     |*Required*|
|`...`|[definition](#types)       |The definition of the property|*Required*|

### Object Info

All info about the object.

|Key        |Type                 |Description                                                               |          |
|-----------|---------------------|--------------------------------------------------------------------------|----------|
|type       |`string`             |The object name being implemented                                         |*Required*|
|description|[description](#types)|A brief description about the object implementation                       |*Required*|
|partial    |`boolean`            |If the object is a partial object where every field is considered optional|*Optional*|
|optional   |`boolean`            |This object can be undefined                                              |*Optional*|

### Types

Additional frequently used types.

|Name         |Type      |Description                                     |
|-------------|----------|------------------------------------------------|
|`description`|`string`  |A brief description about the usage of the field|
|`definition` |[Array Definition](#array-definition) or [Type Definition](#type-definition) or [Object Definition](#object-definition)|Any of the 3 major definition types either annotating a simple type, an object or an array|

<small><i>

`...` Defines a dynamic value which can be anything as long as it follows the schema limitations.

</i></small>

## Commands

The application comes with a few commands built into it. You can use --help or -h for all the commands to get more detailed information.

`interfacer -p <path> -n <name> -i [indent] -e [export]`
`api-template document -s <structure> -o <output> -t <template> -p [pattern] -v [verbose]`
`api-template code -s <structure> -p <project>`
