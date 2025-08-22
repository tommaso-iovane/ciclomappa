<script>
    import { ArrowRight, Download, Info, MapPin, Rotate3d, Route, UploadIcon } from '@lucide/svelte'

    let show = $state(false)
    let infoboxShown = $state(localStorage.getItem('infobox_shown'))

    const close = () => {
        show = false
        localStorage.setItem('infobox_shown', '1')
        infoboxShown = '1'
    }

    const showInfo = () => {
        show = true
    }
</script>

<button
    onclick={showInfo}
    class="fixed top-4 right-4 z-10 flex cursor-pointer items-center rounded-md bg-white p-2 text-gray-900 shadow-md"
>
    {#if !infoboxShown}
        <div class="me-2 flex gap-1">First time? click here<ArrowRight></ArrowRight></div>
    {/if}
    <Info size={16}></Info>
</button>

{#if show}
    <div class="fixed top-8 left-1/2 z-10 h-5/6 w-3/4 max-w-96 -translate-x-1/2 rounded-lg bg-white">
        <div class="max-h-full overflow-y-auto p-4 text-gray-800">
            <div class="mb-2 flex items-center">
                <h2 class="text-xl">Ciclomappa</h2>
                <button class="btn ms-auto" onclick={close}>X</button>
            </div>

            <div class="mt-2">
                This map is powered by <a class="link" href="https://www.opencyclemap.org/">opencyclemap.org</a>
            </div>
            <div class="mt">
                <a href="https://www.flaticon.com/free-icons/cycling" title="cycling icons"
                    >Cycling icons created by smashingstocks - Flaticon</a
                >
            </div>
            <div class="mt-2">
                <h3 class="text-lg">How to</h3>
                <table class="table-cell-spacing w-full">
                    <tbody>
                        <tr>
                            <td><button class="btn"><MapPin size={16}></MapPin></button></td>
                            <td>Center map on user and start following</td>
                        </tr>
                        <tr>
                            <td><button class="btn"><Rotate3d size={16}></Rotate3d></button></td>
                            <td>Toggle automatic map rotation</td>
                        </tr>
                        <tr>
                            <td><button class="btn"><UploadIcon size={16}></UploadIcon></button></td>
                            <td>Upload route guide</td>
                        </tr>
                        <tr>
                            <td><button class="btn"><Route size={16}></Route></button></td>
                            <td>Toggle route tracking</td>
                        </tr>
                        <tr>
                            <td><button class="btn"><Download size={16}></Download></button></td>
                            <td>(When route tracking enabled) download current route</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="mt-2">
                <h3 class="text-lg">Map keys</h3>
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
    </div>
{/if}

<style>
    td {
        padding: 2px;
    }
</style>
