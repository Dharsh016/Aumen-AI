# ReviewOut


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**word_id** | **int** |  | 
**review_date** | **datetime** |  | 
**score** | **int** |  | 
**interval** | **int** |  | 
**easiness_factor** | **float** |  | 
**repetition** | **int** |  | 
**next_review** | **datetime** |  | 

## Example

```python
from srs_sdk.models.review_out import ReviewOut

# TODO update the JSON string below
json = "{}"
# create an instance of ReviewOut from a JSON string
review_out_instance = ReviewOut.from_json(json)
# print the JSON string representation of the object
print(ReviewOut.to_json())

# convert the object into a dict
review_out_dict = review_out_instance.to_dict()
# create an instance of ReviewOut from a dict
review_out_from_dict = ReviewOut.from_dict(review_out_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


