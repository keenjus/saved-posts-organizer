export function clearChildren(element) {
  for(let i = element.childNodes.length - 1; i >= 0; i--) {
    element.removeChild(element.childNodes[i]);
  }
}