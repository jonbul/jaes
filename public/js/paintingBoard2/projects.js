import { asyncRequest, parseLayers } from '/js/functions.js';

const projectBoard = document.getElementById('projectBoard');

const projects = await asyncRequest({ url: '../paintingBoard2/projects/all', method: 'GET' });

if (projects) {

    for (const project of projects) {
        const card = document.createElement('div');
        card.classList.add('projectCard');

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('deleteButton');
        deleteButton.innerHTML = '&#10006;';
        deleteButton.addEventListener('click', deleteProject.bind(null, project._id, card));
        card.appendChild(deleteButton);
        card.appendChild(document.createElement('br'));
        card.appendChild(document.createElement('br'));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = project.canvas.width;
        canvas.height = project.canvas.height;
        canvas.style.width = '100px';
        canvas.style.height = (100 * project.canvas.height / project.canvas.width) + 'px';
        const layers = parseLayers(project.layers)

        for (const layer of layers) {
            layer.draw(ctx);
        }

        card.appendChild(canvas);
        
        const title = document.createElement('h5');
        const link = document.createElement('a');
        link.href = `/paintingBoard2?id=${project._id}`;
        link.textContent = project.name;
        title.appendChild(link);
        card.appendChild(title);

        const createdLabel = document.createElement('label');
        createdLabel.textContent = `Created: ${new Date(project.dateCreated).toLocaleDateString()}`;
        card.appendChild(createdLabel);

        const modifiedLabel = document.createElement('label');
        modifiedLabel.textContent = `Modified: ${new Date(project.dateModified).toLocaleDateString()}`;
        card.appendChild(modifiedLabel);

        projectBoard.appendChild(card);
    }
    function deleteProject(id, card) {
        fetch(`../paintingBoard2/projects?id=${id}`, {
            method: 'DELETE'
        }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    card.remove();
                } else {
                    alert('Failed to delete project.');
                }
            });
    }
}