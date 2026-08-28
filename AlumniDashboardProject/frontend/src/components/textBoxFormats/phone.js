import React, { useState } from 'react';
import { PatternFormat } from 'react-number-format';

export default function PhoneInput() {
    const [value, setValue] = useState('');

    return (
        <PatternFormat
            format="###-###-####"
            mask="_"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="123-456-7890"
        />
    );
}