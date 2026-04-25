# WordCreate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**word** | **str** |  | 
**definition** | **str** |  | 
**language** | **str** |  | 

## Example

```python
from srs_sdk.models.word_create import WordCreate

# TODO update the JSON string below
json = "{}"
# create an instance of WordCreate from a JSON string
word_create_instance = WordCreate.from_json(json)
# print the JSON string representation of the object
print(WordCreate.to_json())

# convert the object into a dict
word_create_dict = word_create_instance.to_dict()
# create an instance of WordCreate from a dict
word_create_from_dict = WordCreate.from_dict(word_create_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


