import java.util.HashSet;

public class Solution {
    public boolean hasDuplicate(int[] nums) {
        HashSet<Integer> seen = new HashSet<>();
        for(int i = 0; i < nums.length; i++){
            if(seen.contains(nums[i])){
                return true;
            }
            seen.add(nums[i]);
        }
        return false;
    }

    public static void main(String[] args) {
        Solution solution = new Solution();
        int[] nums1 = {1, 2, 3, 4, 5};
        int[] nums2 = {1, 2, 3, 2, 5};
        System.out.println("Array nums1 has duplicates? " + solution.hasDuplicate(nums1)); // false
        System.out.println("Array nums2 has duplicates? " + solution.hasDuplicate(nums2)); // true
    }
}
