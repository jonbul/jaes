import { asyncRequest } from "/js/utils/functions.js";

async function load() {
    const data = await asyncRequest({ path: '/game/admin/data' });
    const selectAllowedPlayerType = document.getElementById("allowedPlayerType");
    const selectResolution = document.getElementById("resolution");

    document.getElementById("save").addEventListener("click", async (e) => {
        e.preventDefault();
        const allowedPlayerType = selectAllowedPlayerType.value;
        const resolution = selectResolution.value;
        await asyncRequest({
            path: '/game/admin',
            method: 'POST',
            data: { allowedPlayerType, resolution }
        });
    });

    for (const type in data.allowedPlayerTypes) {
        const option = document.createElement("option");
        option.value = data.allowedPlayerTypes[type];
        option.textContent = type;
        if (data.allowedPlayerType === data.allowedPlayerTypes[type]) {
            option.selected = true;
        }
        selectAllowedPlayerType.appendChild(option);
    }
    for (let i = 0; i < data.resolutions.length; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = data.resolutions[i].name;
        if (data.currentResolution === i) {
            option.selected = true;
        }
        selectResolution.appendChild(option);
    }
}
addEventListener('DOMContentLoaded', load);