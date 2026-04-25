# HistoryOut


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**word** | **str** |  | 
**total_reviews** | **int** |  | 
**average_score** | **float** |  | 
**last_reviewed** | **datetime** |  | 
**streak** | **int** |  | 

## Example

```python
from srs_sdk.models.history_out import HistoryOut

# TODO update the JSON string below
json = "{}"
# create an instance of HistoryOut from a JSON string
history_out_instance = HistoryOut.from_json(json)
# print the JSON string representation of the object
print(HistoryOut.to_json())

# convert the object into a dict
history_out_dict = history_out_instance.to_dict()
# create an instance of HistoryOut from a dict
history_out_from_dict = HistoryOut.from_dict(history_out_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


