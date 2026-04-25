# srs_sdk.WordsApi

All URIs are relative to *http://localhost*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create_word_words_post**](WordsApi.md#create_word_words_post) | **POST** /words/ | Create Word
[**delete_word_words_word_id_delete**](WordsApi.md#delete_word_words_word_id_delete) | **DELETE** /words/{word_id} | Delete Word
[**get_due_words_words_due_get**](WordsApi.md#get_due_words_words_due_get) | **GET** /words/due/ | Get Due Words
[**get_history_words_history_get**](WordsApi.md#get_history_words_history_get) | **GET** /words/history/ | Get History
[**get_word_hint_words_word_id_hint_get**](WordsApi.md#get_word_hint_words_word_id_hint_get) | **GET** /words/{word_id}/hint/ | Get Word Hint
[**submit_review_words_word_id_review_post**](WordsApi.md#submit_review_words_word_id_review_post) | **POST** /words/{word_id}/review/ | Submit Review


# **create_word_words_post**
> WordOut create_word_words_post(word_create)

Create Word

### Example


```python
import srs_sdk
from srs_sdk.models.word_create import WordCreate
from srs_sdk.models.word_out import WordOut
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)
    word_create = srs_sdk.WordCreate() # WordCreate | 

    try:
        # Create Word
        api_response = api_instance.create_word_words_post(word_create)
        print("The response of WordsApi->create_word_words_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->create_word_words_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **word_create** | [**WordCreate**](WordCreate.md)|  | 

### Return type

[**WordOut**](WordOut.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete_word_words_word_id_delete**
> object delete_word_words_word_id_delete(word_id)

Delete Word

### Example


```python
import srs_sdk
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)
    word_id = 56 # int | 

    try:
        # Delete Word
        api_response = api_instance.delete_word_words_word_id_delete(word_id)
        print("The response of WordsApi->delete_word_words_word_id_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->delete_word_words_word_id_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **word_id** | **int**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_due_words_words_due_get**
> List[WordOut] get_due_words_words_due_get()

Get Due Words

### Example


```python
import srs_sdk
from srs_sdk.models.word_out import WordOut
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)

    try:
        # Get Due Words
        api_response = api_instance.get_due_words_words_due_get()
        print("The response of WordsApi->get_due_words_words_due_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->get_due_words_words_due_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[WordOut]**](WordOut.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_history_words_history_get**
> List[HistoryOut] get_history_words_history_get()

Get History

### Example


```python
import srs_sdk
from srs_sdk.models.history_out import HistoryOut
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)

    try:
        # Get History
        api_response = api_instance.get_history_words_history_get()
        print("The response of WordsApi->get_history_words_history_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->get_history_words_history_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[HistoryOut]**](HistoryOut.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_word_hint_words_word_id_hint_get**
> object get_word_hint_words_word_id_hint_get(word_id)

Get Word Hint

### Example


```python
import srs_sdk
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)
    word_id = 56 # int | 

    try:
        # Get Word Hint
        api_response = api_instance.get_word_hint_words_word_id_hint_get(word_id)
        print("The response of WordsApi->get_word_hint_words_word_id_hint_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->get_word_hint_words_word_id_hint_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **word_id** | **int**|  | 

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **submit_review_words_word_id_review_post**
> ReviewOut submit_review_words_word_id_review_post(word_id, review_create)

Submit Review

### Example


```python
import srs_sdk
from srs_sdk.models.review_create import ReviewCreate
from srs_sdk.models.review_out import ReviewOut
from srs_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://localhost
# See configuration.py for a list of all supported configuration parameters.
configuration = srs_sdk.Configuration(
    host = "http://localhost"
)


# Enter a context with an instance of the API client
with srs_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = srs_sdk.WordsApi(api_client)
    word_id = 56 # int | 
    review_create = srs_sdk.ReviewCreate() # ReviewCreate | 

    try:
        # Submit Review
        api_response = api_instance.submit_review_words_word_id_review_post(word_id, review_create)
        print("The response of WordsApi->submit_review_words_word_id_review_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling WordsApi->submit_review_words_word_id_review_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **word_id** | **int**|  | 
 **review_create** | [**ReviewCreate**](ReviewCreate.md)|  | 

### Return type

[**ReviewOut**](ReviewOut.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

