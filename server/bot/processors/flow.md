Initial greeting is sent via _assistant_speaks when user is connected. 

The state becomes state.BOOK_SELECTION
The prompt for the bot is to help the user select a book amongst a list. Currently the list is only one item.


The BookReadingStateManager FrameProcessor
When state = BOOK_SELECTION:
     - get list of book
     - send frame to append system prompt to LLM that gives a prompt to LLM that contains the list of book and their book_id and says
    something of the kind "doiscuss with the user what book to read"
 
 When frame received "StartReading" with payload book id, chunk_id :
     - change state to READING if state = BOOK_SELECTION, leave state to what it was otherwise
     - load the next chunk to read of the book
     - stream as TTS frames
     - send a _assistant_says message saying something of the kind "The assistnat is reading chapter x of book x"

WHen frame received UserStartedSpeaking
    - send an itnerrupt to stop TTS\
    - take note of the last chunk we streamed to resume at the right spot
     - change state to QA
     - updated system prompt to LLM
     - ?? normal interruption flow will trigger the LLM to reply to user?




LLM Has function calls:
 - select_book(book_id: str) --> return True and then call initialize_book from the Library
 - start_reading(book_id, chunk_id)  --> return True and push Frame "StartReading" frame (with payload book_id, chunk_id)
 - resume_reading(book_id) --> resume where it left off 

we have  class called Library that has
- list books that returns an pydantic base model list of Books (for MVP we can fake it and return just the one book we have)

- initialize_book --> given a book_id will load it and send a frame that BookSelected upstream (so that it is caught by BookReadingStateManager). LLM needs to send a function call with the desired book id. returns immediately.
but execute "initialize book".
     
_ load_chunk --> load a chunk to be spoken by tts and return it to caller... or maybe even a yield chunk sort of chunk iterator to allow us to do something like
for chunk in Library.get_chunks():
    send to TTS

_ save progress(book_id) --> called when the call ends 

