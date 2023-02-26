function generatename(){
    const firstnames = ['funny','sad','red','strange','happy','orange','bald','white','black','small','big','angry','pink'];
    const lastnames = ['gecko','elephant','cat','dog','man','woman','boy','girl','giraffe','buttterfly','goblin','panther'];

    const first = firstnames[Math.floor(Math.random() * firstnames.length)];
    const last = lastnames[Math.floor(Math.random() * lastnames.length)];

    return first+" "+last;
} 
