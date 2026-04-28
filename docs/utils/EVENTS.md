# Events

> [Main Readme](../../README.md) > [Utils](../utils/UTILS.md) > Events

There are two patterns for creating events for registering callbacks and triggering. One for cases where an unlimited number of callbacks can be registered, the other where only one callback can be registered, and registering another will overwrite the previous.

## `Event`
Create an event with
```typescript
function Event()
```

This returns an `onEvent` function, which can be used to register callbacks for that event. 

```typescript
let onSomeEvent = Event();
onSomeEvent((param0,param1)=>{
    console.log(`some event happened with params ${param0}, ${param1}`);
});
```

To trigger the event and fire off any registerd callbacks, the onEvent function has a trigger method. The event can be fired with any params.



```typescript
let onSomeEvent = Event();

// trigger the event with params ("someParam", 1, 2n)
onSomeEvent.trigger("someParam", 1, 2n);
```

### Removing callbacks
There are two ways to remove callbacks. The main callback registration function returns another function to remove that callback

```typescript
let onSomeEvent = Event();
let killThisCallback = onSomeEvent(()=>{/* do stuff*/});

//remove the callback
killThisCallback();
```

There is also a `killAll` method to remove all callbacks.

```typescript
let onSomeEvent = Event();
onSomeEvent(()=>{/* do stuff*/});
onSomeEvent(()=>{/* do other stuff*/});

//remove them all
onSomeEvent.killAll()
```