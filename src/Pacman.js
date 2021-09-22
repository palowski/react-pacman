import React, {useReducer, useRef, useEffect} from "react";
const LEVEL = [      
  [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 ],
  [ 1,3,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1 ],
  [ 1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,4,1,1,1,2,1 ],
  [ 1,2,2,2,2,2,2,1,2,2,1,2,2,2,2,2,2,2,2,2,1 ],
  [ 1,1,1,2,1,1,2,1,2,1,1,1,2,1,1,2,1,2,1,2,1 ],
  [ 1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1,2,1,2,1 ],
  [ 1,2,1,1,2,1,2,1,1,1,2,1,1,1,2,1,1,2,1,2,1 ],
  [ 1,2,1,1,2,1,2,1,2,2,2,2,2,1,2,2,2,2,2,2,1 ],
  [ 1,2,1,1,2,2,2,1,2,2,4,2,2,1,2,1,1,1,1,2,1 ],
  [ 1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1 ],
  [ 1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1 ],
  [ 1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1 ],
  [ 1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,1,2,4,2,2,1 ],
  [ 1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1 ],
  [ 1,2,2,2,2,2,2,4,2,2,1,2,2,2,2,2,2,2,2,2,1 ],
  [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 ]
]
//             Playground  Wall    Food    Pacman   Ghost
const COLOR = ["#ddd",     "#444", "#aaa", "green", "red"]
const GAME_STATUS = {
  Running:          "RUNING",
  GameOver:         "GAMEOVER",
  Done:             "DONE"
}
const ACTION = {
  Restart:          "RESTART",  // restart game
  Move:             "MOVE",     // change Pacman direction 
  TimeTick:         "TIMETICK"  // move all game objects 
}
const ITEM = {
  Playground:       0,    
  Wall:             1,
  Food:             2,          // playground bellow
  Pacman:           3,          // playground bellow, food below
  Ghost:            4           // playground bellow, food below
}
const SPEED =       500 // [ms]
const CONTROL = { 
  Left:             37, 
  Right:            39, 
  Up:               38,
  Down:             40
}

function useInterval(callback, delay) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

function getInitialState() {
  let level = [], pacman = {position: {x: 0, y: 0}, direction:{x: 0, y: 0}}, ghost = []
  for (let y=0; y<LEVEL.length; y++) {                         // parse level plan and init game objects
    level[y] = []
    for (let x=0; x<LEVEL[y].length; x++) {
      if ( LEVEL[y][x] === ITEM.Ghost )  
        ghost.push({x, y, isMoving: ghost.length%2===0 })      // Ghost, isMoving: alternated during initialization
      if ( LEVEL[y][x] === ITEM.Pacman ) 
        pacman = {position: {x, y}, direction: {x: -1, y: 0}}  // Pacman position
      if ( LEVEL[y][x] === ITEM.Ghost )                        // cast Ghost as Food
        level[y][x] = ITEM.Food                         
      else if ( LEVEL[y][x] === ITEM.Pacman )                   // cast Pacman as field without Food, aka Playground
        level[y][x] = ITEM.Playground 
      else  
        level[y][x] = LEVEL[y][x]                               // otherwise get type from the level map - Wall, Food, Playground
    }
  }
  return { status: GAME_STATUS.Running, level, pacman, ghost }
}

function gameReducer(state, action) {
  switch (action.type) {
    case ACTION.Restart:
      return { ...getInitialState() }
    case ACTION.Move:
      let d = {x: 0, y: 0}
      if (CONTROL.Left  === action.keyCode) d.x--
      if (CONTROL.Right === action.keyCode) d.x++
      if (CONTROL.Up    === action.keyCode) d.y--
      if (CONTROL.Down  === action.keyCode) d.y++
      return {...state, pacman: {...state.pacman, direction: d}}
    case ACTION.TimeTick: 
      // 0. chek level completed
      let isDone = true
      for (let row of state.level) 
        for (let item of row) 
          if (item === ITEM.Food) isDone = false
      
      if (isDone) return {...state, status: GAME_STATUS.Done}
      // 1. compute new proposed pacman position
      let newPacmanPosition = {x: state.pacman.position.x + state.pacman.direction.x, y: state.pacman.position.y + state.pacman.direction.y}
      // 2. move ghosts - super simplified, no DFS, BFS, AI...  
      let newGhost = [...state.ghost].map(g => {
        // ghost movement: 2x pacman = 1x ghost. isMove inversed every TimeTick (to ensure 50% speed of the pacman)
        if (!g.isMoving) return {...g, isMoving: true} 
        // - x axis movement preffered, then y axis movement
        if (newPacmanPosition.x < g.x && state.level[g.y][g.x-1] !== ITEM.Wall) return {x: g.x-1, y: g.y, isMoving: false}
        if (newPacmanPosition.x > g.x && state.level[g.y][g.x+1] !== ITEM.Wall) return {x: g.x+1, y: g.y, isMoving: false}
        if (newPacmanPosition.y < g.y && state.level[g.y-1][g.x] !== ITEM.Wall) return {x: g.x, y: g.y-1, isMoving: false}
        if (newPacmanPosition.y > g.y && state.level[g.y+1][g.x] !== ITEM.Wall) return {x: g.x, y: g.y+1, isMoving: false}
        return {...g, isMoving:false}        // otherwise no ghost movement
      })
      // 4. check collistion with the wall
      if (state.level[newPacmanPosition.y][newPacmanPosition.x] !== ITEM.Wall) {
        // 5. check collision with the ghost
        if (newGhost.find( g => { return newPacmanPosition.x === g.x && newPacmanPosition.y === g.y })) 
          return {...state, pacman: {...state.pacman, position: newPacmanPosition }, status: GAME_STATUS.GameOver}
        let newLevel = [...state.level].map(function(arr) { return arr.slice() })    // mark new position as Playground (without Food)
        newLevel[newPacmanPosition.y][newPacmanPosition.x] = ITEM.Playground
        return {...state, pacman: {...state.pacman, position: newPacmanPosition }, level: newLevel, ghost: newGhost }
      }
      // pacman is not moving, blocked by the wall
      else {
        // check collision with the ghost
        if (newGhost.find( g => { return state.pacman.position.x === g.x && state.pacman.position.y === g.y })) 
          return {...state, status: GAME_STATUS.GameOver}       // killed by the ghost, gameover
        return {...state, ghost: newGhost}                      // return current position, deny movement
      }
    default:
  }
  return {...state}
}

function Box({color}) {
  return (<div style={{ width:20, height:20, display: 'inline-block', backgroundColor: color, border: '1px solid #ccc'}}/>)
}

export default function Pacman() {
  let [state, dispatch] = useReducer(gameReducer, getInitialState() )
  useInterval(() => { dispatch({type: ACTION.TimeTick}) }, state.status === GAME_STATUS.Running ? SPEED : null)  
  useEffect(() => { document.addEventListener('keydown', handleGameAction); return () => { document.removeEventListener('keydown', handleGameAction) } });  
  console.log(state)

  function handleGameAction(e) {
    if ( [CONTROL.Left, CONTROL.Right, CONTROL.Up, CONTROL.Down].includes(e.keyCode) ) {
      e.preventDefault(); 
      dispatch({type: ACTION.Move, keyCode: e.keyCode}) }
  }

  return (
    <div className="Pacman">
        <div>React Pacman. controls: LEFT, RIGHT, UP, DOWN. <br/>characters: green=pacman, red=ghost, darkgrey=food, lightgrey=no food, black=wall</div>
        <button onClick={()=> dispatch({type: ACTION.Restart})}>Restart level</button>
        {state.status === GAME_STATUS.GameOver && <h3>Killed, try again!</h3>}
        {state.status === GAME_STATUS.Done && <h3>Level completed!</h3>}
        {[...state.level].map( (row, y) => {
          return <div key={`${y}`} style={{display: 'block', lineHeight: 0}}>{
            row.map( (col, x) => {return <Box key={`${y}-${x}`} content={state.level[y][x]} 
            // little bit unreadable here... srry
            color={COLOR[ (state.pacman.position.x ===x && state.pacman.position.y === y ? ITEM.Pacman :                    // pacman
                          (state.ghost.find(g => g.x===x && g.y===y)) ? ITEM.Ghost :                                        // ghost
                          ( (  [ITEM.Wall, ITEM.Playground, ITEM.Food].includes(state.level[y][x]) ?  state.level[y][x] :   // get color from level plan                                                          // wall, playground, food
                          null )))  ]} />})                                                           
          }</div> 
        })}
    </div>
  );
}