accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#equation-picker'),
    // additional options
    onConfirm: (value) => {
        autocompleteChanged(value)
    }
  })

function autocompleteChanged(value) {
    const selectedValue = value;
    // Perform actions based on the selected value
    console.log("Selected:", selectedValue);

    if(value == "integral"){
        const input = prompt("Enter your integral, and your variable, separated by a comma");
        const values = input.split(",");

        // Access individual values
        const value1 = values[0];
        const value2 = values[1];
    }
}