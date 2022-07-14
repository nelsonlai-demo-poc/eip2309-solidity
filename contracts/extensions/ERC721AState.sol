//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract ERC721AState is Ownable {
    enum ProjectState {
        Prepare, // 0
        Minting // 1
    }
    ProjectState public projectState;

    //// Write Functions ////

    /** @dev update projectState
     */
    function setProjectState(ProjectState _projectState) public onlyOwner {
        projectState = _projectState;
    }
}
