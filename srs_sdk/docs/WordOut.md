# WordOut


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**word** | **str** |  | 
**definition** | **str** |  | 
**language** | **str** |  | 
**created_at** | **datetime** |  | 
**ai_enrichment** | **str** |  | [optional] 
**streak** | **int** |  | 
**xp** | **int** |  | 

## Example

```python
from srs_sdk.models.word_out import WordOut

# TODO update the JSON string below
json = "{}"
# create an instance of WordOut from a JSON string
word_out_instance = WordOut.from_json(json)
# print the JSON string representation of the object
print(WordOut.to_json())

# convert the object into a dict
word_out_dict = word_out_instance.to_dict()
# create an instance of WordOut from a dict
word_out_from_dict = WordOut.from_dict(word_out_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


