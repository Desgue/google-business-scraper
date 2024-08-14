function objectToCSV(obj) {
    // Get all unique keys from the object
    const headers = Object.keys(obj);
    
    // Create the CSV string, starting with the headers
    let csvString = headers.join(',') + '\n';
    
    // Add the values
    csvString += headers.map(header => {
      // Get the value, or an empty string if the value is undefined
      const value = obj[header] !== undefined ? obj[header] : '';
      // Convert to string, wrap in quotes, and escape any existing quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
    
    return csvString;
  }