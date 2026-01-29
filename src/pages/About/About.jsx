import React, { useEffect, useReducer, useRef, useState } from 'react'

const About = () => {
  const [count, setCount] = useState(0)
  const ref = useRef(count)
  console.log("ref.current", ref.current)

  useEffect(() => {
    ref.current = count
    console.log(ref.current);
  }, [count])
    
  
  return (
    <div>
      <p>current count: {count}</p>
      <p>prev count: {ref.current}</p>
      <button className="btn btn-primary" onClick={() => setCount(count + 1)}>+</button>
      
    </div>
  )
}

export default About
