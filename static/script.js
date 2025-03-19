function createPopout(element_id, title, click_element_id = null, width=1280, height=1024) {
    const element = document.getElementById(element_id);
    const click_element = click_element_id ? document.getElementById(click_element_id) : element;

    let newWindow;

    click_element.addEventListener('click', function() {
        newWindow = window.open('', '', `width=${width}, height=${height}`);

        if (newWindow) {
            newWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <script src="https://d3js.org/d3.v6.min.js"></script>
                        <style>
                            body {
                                background-color: lightgrey;
                                margin: 0;
                                overflow: hidden;
                            }
                        </style>
                    </head>
                    <body>
                        ${element.outerHTML}
                        <script>
                            document.addEventListener('DOMContentLoaded', function() {
                                const svg = d3.select("#${element_id}");
                                const svgNode = svg.node();
                                const svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

                                // Move existing elements into the group
                                while (svgNode.firstChild) {
                                    svgGroup.appendChild(svgNode.firstChild);
                                }
                                svgNode.appendChild(svgGroup);

                                const zoom = d3.zoom()
                                    .scaleExtent([0.5, 10])
                                    .on("zoom", function(event) {
                                        d3.select(svgGroup).attr("transform", event.transform);
                                    });

                                d3.select(svgNode).call(zoom)
                                    .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

                            });
                        </script>
                    </body>
                </html>
            `);
            newWindow.document.close();

            // Creates a mutation observer to listen for style changes in the SVG content
            createMutationObserver('mySvg', newWindow);

        } else {
            alert('Please allow popups for this website');
        }
    });
}


function findPopoutElement(mutation_target, popoutWindow) {
    /* 
    
    Finds the respective element in the popout window that corresponds to the mutation target.

    Takes the mutation target, finds the relevant parent group to reference for searching 
    in the popout window, converts the ID to a raw string to avoid special characters, and
    fetches the respective element from the popout window.

    params:
        mutation_target: The target of the mutation
        popoutWindow: The popout window object

    returns:
        popoutElement: The element in the popout window that corresponds to the mutation target

    */ 

    const updatedElementParent = mutation_target.parentNode;
    const rawID = String.raw`${updatedElementParent.id}`;
    const popoutElementGroup = popoutWindow.document.getElementById(`${rawID}`);

    // TODO: Adjust this to target specific desired elements (e.g line, polygon, etc..)
    // Ideally should be dynamic based on the element 
    const popoutElement = popoutElementGroup.querySelector('polygon');

    return popoutElement;
}


function createMutationObserver(svg_id, popoutWindow) {
    /*

    This function creates a MutationObserver that listens for changes to the SVG content.
    When a change is detected, the function logs a message to the console.

    params:
        svg_id: The ID of the SVG element, without the '#'

    */
    const svg = document.querySelector(`#${svg_id}`);
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const updatedElement = mutation.target;
                const popoutElement = findPopoutElement(updatedElement, popoutWindow);

                // If the popout element exists, 
                if (popoutElement) {
                    // Update the style of the popout element
                    popoutElement.setAttribute('style', updatedElement.getAttribute('style'));
                }
            }
        });
    })

    // Observe the SVG content for changes in style
    observer.observe(svg, {
        childList: true, 
        subtree: true,
        attributeFilter: ['style']
    });

}


function loadSVG(svg_file){
    // Load the SVG file
    d3.xml(`/static/assets/${svg_file}`).then(data => {
        const importedNode = document.importNode(data.documentElement, true);
        document.getElementById("mySvg").appendChild(importedNode);
    });

    // Wait for the SVG to load before calling the function to setup zoom and pan
    setTimeout(() => setupZoomAndPan("mySvg"), 100);
}


function setupZoomAndPan(element_id) {
    const svg = d3.select(`#${element_id}`);
    const svgNode = svg.node();
    const svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Move existing elements into the group
    while (svgNode.firstChild) {
        svgGroup.appendChild(svgNode.firstChild);
    }
    svgNode.appendChild(svgGroup);

    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", function(event) {
            d3.select(svgGroup).attr("transform", event.transform);
        });

    d3.select(svgNode).call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    svgNode.firstChild = true;
}


function colourElementGroup(element_group, fill_colour='red', stroke_colour='red') {
    /* 

        Colours all elements in a group with the specified fill and stroke colours.
        If the fill attribute is 'none', the element will not be filled. This is to
        account for circles and other elements that should be left unfilled.

        params:
            element_group: The group of elements to colour
            fill_colour: The colour to fill the elements
            stroke_colour: The colour to stroke the elements

    */


    // An example of how you can change the colour of a specific element in the group
    // const testElement = testElementGroup.querySelector('polygon');
    // testElement.attributes.fill.value = 'red';
    // testElement.attributes.stroke.value = 'red';

    // An example of how you can change the style of all elements in the group
    for (let i = 0; i < element_group.children.length; i++) {
        const element = element_group.children[i];
        // If fill attribute is 'none', don't fill the element
        if (element.attributes.fill.value !== 'none') {
            element.attributes.fill.value = fill_colour;
        }
        element.attributes.stroke.value = stroke_colour;
    }
}

document.addEventListener('DOMContentLoaded', loadSVG('plot.svg'));
    
// Change circle colour
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('button-1');
    button.addEventListener('click', function() {
        // Change circle colour
        const testElementGroup = document.getElementById(String.raw`Grid - UKPN & National Grid\DNO-UKPN\Rayleigh Local\RAYL3\GT2B_CB.ElmCoup`);

        colourElementGroup(testElementGroup, 'red', 'red');

    });
    }
)

// Popout button
document.addEventListener('DOMContentLoaded', createPopout('mySvg', 'SVG Content', 'button-2')); 
