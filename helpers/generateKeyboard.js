module.exports = generateKeyboard = (couriers) => {
    let keyboard = [];
    let row = [];
  
    for (let i = 0; i < couriers.length; i++) {
      row.push({ text: `${couriers[i].name} ($1)` });
  
      // If the row has two buttons, add it to the keyboard and reset the row
      if (row.length === 2) {
        keyboard.push(row);
        row = [];
      }
    }
  
    // If there's an odd number of couriers, add the main menu button to the current row
    if (row.length === 1) {
      row.push({ text: "🔙 Main Menu" });
      keyboard.push(row);
    } else {
      // Add the main menu button as a new row if the couriers are an even number
      keyboard.push([{ text: "🔙 Main Menu" }]);
    }
  
    return {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: keyboard,
        resize_keyboard: true,
      },
    };
  };
  