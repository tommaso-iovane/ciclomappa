<script>
    let show = $state(localStorage.getItem('infobox_shown') ? false : true)

    const close = () => {
        show = false
        localStorage.setItem('infobox_shown', '1')
    }
</script>

{#if show}
    <div class="fixed top-9 left-1/2 z-10 h-5/6 w-3/4 max-w-96 -translate-x-1/2 rounded-lg bg-white">
        <div class="max-h-full overflow-y-auto p-4 text-gray-800">
            <div class="mb-2 flex items-center">
                <span>How to</span>
                <button class="btn ms-auto" onclick={close}>X</button>
            </div>
            <table class="table-cell-spacing w-full">
                <tbody>
                    <tr>
                        <td><img src="https://www.opencyclemap.org/key/ncn-10.png" alt="" /></td>
                        <td><img src="https://www.opencyclemap.org/key/ncn-15.png" alt="" /></td>
                        <td>National Cycle Route</td>
                    </tr>
                    <tr>
                        <td><img src="https://www.opencyclemap.org/key/Regional Cycle Route-10.png" alt="" /></td>
                        <td><img src="https://www.opencyclemap.org/key/Regional Cycle Route-15.png" alt="" /></td>
                        <td>Regional Cycle Route</td>
                    </tr>
                    <tr>
                        <td><img src="https://www.opencyclemap.org/key/lcn-11.png" alt="" /></td>
                        <td><img src="https://www.opencyclemap.org/key/lcn-15.png" alt="" /></td>
                        <td>Local Cycle Route</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/National Cycle Node Network-17.png" alt="" /></td>
                        <td>National Node Network</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Regional Cycle Node Network-17.png" alt="" /></td>
                        <td>Regional Node Network</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Local Cycle Node Network-17.png" alt="" /></td>
                        <td>Local Node Network</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/cycleway-15.png" alt="" /></td>
                        <td>Cyclepath</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/path-15.png" alt="" /></td>
                        <td>Footpath (no cycling)</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Large Bicycle Parking-17.png" alt="" /></td>
                        <td>Large Bicycle Parking, with capacity &gt;= 20</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Bicycle Parking-17.png" alt="" /></td>
                        <td>Small Bicycle Parking</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/bikeshop-15.png" alt="" /></td>
                        <td>Bicycle shop</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Bicycle rental-17.png" alt="" /></td>
                        <td>Bicycle Rental station</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/toilets-17.png" alt="" /></td>
                        <td>Toilets</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Cafe-17.png" alt="" /></td>
                        <td>Cafe</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Drinking Water-17.png" alt="" /></td>
                        <td>Drinking Water</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Pub-17.png" alt="" /></td>
                        <td>Pub</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Pub with free wifi-17.png" alt="" /></td>
                        <td>Pub with free wifi</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Shelter-17.png" alt="" /></td>
                        <td>Shelter</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/hospital-17.png" alt="" /></td>
                        <td>Hospital</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Post Office-17.png" alt="" /></td>
                        <td>Post Office</td>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        <td><img src="https://www.opencyclemap.org/key/Postbox-17.png" alt="" /></td>
                        <td>Postbox</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
{/if}

<style>
    td {
        padding: 1px;
    }
</style>