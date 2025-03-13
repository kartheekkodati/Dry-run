document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const runBtn = document.querySelector('.run-btn');
  const stepBackBtn = document.getElementById('stepBackBtn');
  const stepForwardBtn = document.getElementById('stepForwardBtn');
  const resetBtn = document.querySelector('.reset-btn');
  const codeDisplay = document.getElementById('codeDisplay');
  const dryRunOutput = document.getElementById('dryRunOutput');

  // Sample code for merging two sorted linked lists
  const sampleCode = `// Definition for singly-linked list
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

/**
 * Merge two sorted linked lists and return it as a sorted list.
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
function mergeTwoLists(l1, l2) {
  // Create a dummy head node
  let dummy = new ListNode(-1);
  let current = dummy;
  
  // Traverse both lists and compare values
  while (l1 !== null && l2 !== null) {
    if (l1.val <= l2.val) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }
  
  // Attach remaining nodes
  if (l1 !== null) {
    current.next = l1;
  } else {
    current.next = l2;
  }
  
  // Return the merged list (skip the dummy head)
  return dummy.next;
}

// Example usage
let list1 = new ListNode(1, new ListNode(2, new ListNode(4)));
let list2 = new ListNode(1, new ListNode(3, new ListNode(5)));
let mergedList = mergeTwoLists(list1, list2);`;

  // Execution state
  let executionState = {
    currentStep: 0,
    steps: [],
    isRunning: false,
    list1: null,
    list2: null,
    mergedList: null
  };

  // Initialize code display
  function initializeCodeDisplay() {
    const lines = sampleCode.split('\n');
    codeDisplay.innerHTML = lines.map((line, index) => 
      `<div class="code-line" data-line="${index + 1}">${line}</div>`
    ).join('');
  }

  // Create a linked list visualization
  function createLinkedListVisualization(list, label) {
    const container = document.createElement('div');
    container.className = 'list-row';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'list-label';
    labelElement.textContent = label + ':';
    container.appendChild(labelElement);
    
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'nodes-container';
    nodesContainer.style.display = 'flex';
    
    let current = list;
    while (current) {
      const nodeElement = document.createElement('div');
      nodeElement.className = 'node';
      
      const valueElement = document.createElement('div');
      valueElement.className = 'node-value';
      valueElement.textContent = current.val;
      nodeElement.appendChild(valueElement);
      
      if (current.next) {
        const pointerElement = document.createElement('div');
        pointerElement.className = 'node-pointer';
        nodeElement.appendChild(pointerElement);
      } else {
        const nullPointer = document.createElement('div');
        nullPointer.className = 'null-pointer';
        nullPointer.textContent = '⊥';
        nodeElement.appendChild(nullPointer);
      }
      
      nodesContainer.appendChild(nodeElement);
      current = current.next;
    }
    
    container.appendChild(nodesContainer);
    return container;
  }

  // Simulate the execution of the merge algorithm
  function simulateExecution() {
    // Reset execution state
    executionState.steps = [];
    executionState.currentStep = 0;
    
    // Define the ListNode class
    class ListNode {
      constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
      }
    }
    
    // Create the input lists
    const list1 = new ListNode(1, new ListNode(2, new ListNode(4)));
    const list2 = new ListNode(1, new ListNode(3, new ListNode(5)));
    
    executionState.list1 = list1;
    executionState.list2 = list2;
    
    // Add initial state
    executionState.steps.push({
      line: 35,
      description: "Initialize list1 with values [1, 2, 4]",
      list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
      list2: null,
      merged: null
    });
    
    executionState.steps.push({
      line: 36,
      description: "Initialize list2 with values [1, 3, 5]",
      list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
      list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
      merged: null
    });
    
    // Call mergeTwoLists with step tracking
    executionState.steps.push({
      line: 37,
      description: "Call mergeTwoLists function",
      list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
      list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
      merged: null
    });
    
    // Create a dummy head node
    let dummy = new ListNode(-1);
    let current = dummy;
    
    executionState.steps.push({
      line: 14,
      description: "Create a dummy head node with value -1",
      list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
      list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
      merged: [-1],
      l1Pointer: 0,
      l2Pointer: 0,
      currentPointer: 0
    });
    
    // Traverse both lists and compare values
    let l1 = list1;
    let l2 = list2;
    
    while (l1 !== null && l2 !== null) {
      executionState.steps.push({
        line: 18,
        description: "Compare values: " + l1.val + " and " + l2.val,
        list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
        list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
        merged: convertListToArray(dummy),
        l1Pointer: getNodeIndex(list1, l1),
        l2Pointer: getNodeIndex(list2, l2),
        currentPointer: getNodeIndex(dummy, current)
      });
      
      if (l1.val <= l2.val) {
        executionState.steps.push({
          line: 19,
          description: l1.val + " <= " + l2.val + ", attach " + l1.val + " to merged list",
          list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
          list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
          merged: convertListToArray(dummy),
          l1Pointer: getNodeIndex(list1, l1),
          l2Pointer: getNodeIndex(list2, l2),
          currentPointer: getNodeIndex(dummy, current)
        });
        
        current.next = l1;
        l1 = l1.next;
        
        executionState.steps.push({
          line: 20,
          description: "Move l1 pointer to next node",
          list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
          list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
          merged: convertListToArray(dummy),
          l1Pointer: l1 ? getNodeIndex(list1, l1) : -1,
          l2Pointer: getNodeIndex(list2, l2),
          currentPointer: getNodeIndex(dummy, current)
        });
      } else {
        executionState.steps.push({
          line: 22,
          description: l1.val + " > " + l2.val + ", attach " + l2.val + " to merged list",
          list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
          list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
          merged: convertListToArray(dummy),
          l1Pointer: getNodeIndex(list1, l1),
          l2Pointer: getNodeIndex(list2, l2),
          currentPointer: getNodeIndex(dummy, current)
        });
        
        current.next = l2;
        l2 = l2.next;
        
        executionState.steps.push({
          line: 23,
          description: "Move l2 pointer to next node",
          list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
          list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
          merged: convertListToArray(dummy),
          l1Pointer: getNodeIndex(list1, l1),
          l2Pointer: l2 ? getNodeIndex(list2, l2) : -1,
          currentPointer: getNodeIndex(dummy, current)
        });
      }
      
      current = current.next;
      
      executionState.steps.push({
        line: 25,
        description: "Move current pointer to next node",
        list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
        list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
        merged: convertListToArray(dummy),
        l1Pointer: l1 ? getNodeIndex(list1, l1) : -1,
        l2Pointer: l2 ? getNodeIndex(list2, l2) : -1,
        currentPointer: getNodeIndex(dummy, current)
      });
    }
    
    // Attach remaining nodes
    if (l1 !== null) {
      executionState.steps.push({
        line: 29,
        description: "List2 is empty, attach remaining nodes from list1",
        list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
        list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
        merged: convertListToArray(dummy),
        l1Pointer: l1 ? getNodeIndex(list1, l1) : -1,
        l2Pointer: l2 ? getNodeIndex(list2, l2) : -1,
        currentPointer: getNodeIndex(dummy, current)
      });
      
      current.next = l1;
    } else {
      executionState.steps.push({
        line: 31,
        description: "List1 is empty, attach remaining nodes from list2",
        list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
        list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
        merged: convertListToArray(dummy),
        l1Pointer: l1 ? getNodeIndex(list1, l1) : -1,
        l2Pointer: l2 ? getNodeIndex(list2, l2) : -1,
        currentPointer: getNodeIndex(dummy, current)
      });
      
      current.next = l2;
    }
    
    // Return the merged list
    executionState.steps.push({
      line: 35,
      description: "Return the merged list (skip the dummy head)",
      list1: JSON.parse(JSON.stringify(convertListToArray(list1))),
      list2: JSON.parse(JSON.stringify(convertListToArray(list2))),
      merged: convertListToArray(dummy.next),
      l1Pointer: -1,
      l2Pointer: -1,
      currentPointer: -1,
      final: true
    });
    
    executionState.mergedList = dummy.next;
    return dummy.next;
  }
  
  // Helper function to convert a linked list to an array
  function convertListToArray(head) {
    const result = [];
    let current = head;
    while (current) {
      result.push(current.val);
      current = current.next;
    }
    return result;
  }
  
  // Helper function to get the index of a node in a linked list
  function getNodeIndex(head, node) {
    if (!node) return -1;
    
    let current = head;
    let index = 0;
    
    while (current) {
      if (current === node) {
        return index;
      }
      current = current.next;
      index++;
    }
    
    return -1;
  }

  // Display the current step
  function displayStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= executionState.steps.length) {
      return;
    }
    
    // Update current step
    executionState.currentStep = stepIndex;
    
    // Get the current step
    const step = executionState.steps[stepIndex];
    
    // Highlight the current line
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach(line => line.classList.remove('highlighted'));
    
    if (step.line) {
      const lineToHighlight = document.querySelector(`.code-line[data-line="${step.line}"]`);
      if (lineToHighlight) {
        lineToHighlight.classList.add('highlighted');
        lineToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    // Update the dry run output
    dryRunOutput.innerHTML = '';
    
    // Add step description
    const descriptionElement = document.createElement('div');
    descriptionElement.textContent = `Step ${stepIndex + 1}: ${step.description}`;
    descriptionElement.style.fontWeight = 'bold';
    descriptionElement.style.marginBottom = '10px';
    dryRunOutput.appendChild(descriptionElement);
    
    // Create linked list visualization container
    const linkedListContainer = document.createElement('div');
    linkedListContainer.className = 'linked-list-container';
    
    // Create list1 visualization if available
    if (step.list1) {
      const list1 = createLinkedListFromArray(step.list1);
      const list1Viz = createLinkedListVisualization(list1, 'List 1');
      
      // Highlight the current node if applicable
      if (step.l1Pointer >= 0) {
        const nodes = list1Viz.querySelectorAll('.node');
        if (nodes[step.l1Pointer]) {
          nodes[step.l1Pointer].classList.add('active');
        }
      }
      
      linkedListContainer.appendChild(list1Viz);
    }
    
    // Create list2 visualization if available
    if (step.list2) {
      const list2 = createLinkedListFromArray(step.list2);
      const list2Viz = createLinkedListVisualization(list2, 'List 2');
      
      // Highlight the current node if applicable
      if (step.l2Pointer >= 0) {
        const nodes = list2Viz.querySelectorAll('.node');
        if (nodes[step.l2Pointer]) {
          nodes[step.l2Pointer].classList.add('active');
        }
      }
      
      linkedListContainer.appendChild(list2Viz);
    }
    
    // Create merged list visualization if available
    if (step.merged) {
      const mergedList = createLinkedListFromArray(step.merged);
      const mergedListViz = createLinkedListVisualization(mergedList, 'Merged');
      
      // Highlight the current node if applicable
      if (step.currentPointer >= 0) {
        const nodes = mergedListViz.querySelectorAll('.node');
        if (nodes[step.currentPointer]) {
          nodes[step.currentPointer].classList.add('active');
        }
      }
      
      // Add result class if it's the final step
      if (step.final) {
        mergedListViz.querySelectorAll('.node').forEach(node => {
          node.classList.add('result');
        });
      }
      
      linkedListContainer.appendChild(mergedListViz);
    }
    
    dryRunOutput.appendChild(linkedListContainer);
    
    // Update button states
    stepBackBtn.disabled = stepIndex <= 0;
    stepForwardBtn.disabled = stepIndex >= executionState.steps.length - 1;
  }
  
  // Helper function to create a linked list from an array
  function createLinkedListFromArray(arr) {
    if (!arr || arr.length === 0) return null;
    
    class ListNode {
      constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
      }
    }
    
    let dummy = new ListNode(0);
    let current = dummy;
    
    for (const val of arr) {
      current.next = new ListNode(val);
      current = current.next;
    }
    
    return dummy.next;
  }

  // Event handlers
  runBtn.addEventListener('click', () => {
    if (!executionState.isRunning) {
      executionState.isRunning = true;
      simulateExecution();
      displayStep(0);
      stepBackBtn.disabled = true;
      stepForwardBtn.disabled = false;
    }
  });

  stepBackBtn.addEventListener('click', () => {
    if (executionState.isRunning && executionState.currentStep > 0) {
      displayStep(executionState.currentStep - 1);
    }
  });

  stepForwardBtn.addEventListener('click', () => {
    if (executionState.isRunning && executionState.currentStep < executionState.steps.length - 1) {
      displayStep(executionState.currentStep + 1);
    }
  });

  resetBtn.addEventListener('click', () => {
    executionState.isRunning = false;
    executionState.currentStep = 0;
    executionState.steps = [];
    
    // Reset code highlighting
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach(line => line.classList.remove('highlighted'));
    
    // Clear dry run output
    dryRunOutput.innerHTML = '';
    
    // Reset button states
    stepBackBtn.disabled = true;
    stepForwardBtn.disabled = true;
  });

  // Initialize the application
  initializeCodeDisplay();
});